type ReadFetchOptions = {
  fetchImpl?: typeof fetch
  timeoutMs?: number
  retryDelayMs?: number
  warn?: (message: string, details: Record<string, string | number>) => void
}

/** Retry only Supabase REST reads and user validation, never writes or RPCs. */
export function createSupabaseReadFetch(baseUrl: string, options: ReadFetchOptions = {}): typeof fetch {
  const origin = new URL(baseUrl).origin
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? 8_000
  const retryDelayMs = options.retryDelayMs ?? 200
  const warn = options.warn ?? ((message, details) => console.warn(message, details))

  return async (input, init) => {
    const request = input instanceof Request ? input : null
    const url = new URL(request?.url ?? String(input))
    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase()
    const isRead = method === 'GET' || method === 'HEAD'
    const isRestRead = url.pathname.startsWith('/rest/v1/') && !url.pathname.startsWith('/rest/v1/rpc/')
    if (url.origin !== origin || !isRead || (!isRestRead && url.pathname !== '/auth/v1/user')) {
      return fetchImpl(input, init)
    }

    const callerSignal = init?.signal ?? request?.signal
    const resource = isRestRead ? '/rest/v1/' + url.pathname.split('/')[3] : '/auth/v1/user'
    for (let attempt = 1; attempt <= 3; attempt++) {
      callerSignal?.throwIfAborted()
      const timeout = AbortSignal.timeout(timeoutMs)
      const signal = callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout
      try {
        const response = await fetchImpl(input, { ...init, signal })
        if ([502, 503, 504].includes(response.status)) {
          warn('Supabase read gateway failure', { resource, status: response.status, attempt })
          if (attempt === 3) return response
          await response.body?.cancel()
        } else {
          // Include the response body in the timeout/retry boundary. A gateway
          // can send headers promptly and stall while transferring the JSON.
          const body = response.body ? await response.arrayBuffer() : null
          return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          })
        }
      } catch (error) {
        // Cancellation belongs to the caller; it must not create another read.
        callerSignal?.throwIfAborted()
        const transient = timeout.aborted || error instanceof TypeError
        if (!transient) throw error
        warn('Supabase read connection failure', { resource, reason: timeout.aborted ? 'timeout' : 'network', attempt })
        if (attempt === 3) throw error
      }
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt))
    }
    throw new Error('Supabase read attempts exhausted')
  }
}
