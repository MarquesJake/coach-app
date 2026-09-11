'use client'

import { useEffect, useEffectEvent, useState } from 'react'

/** Keep an old club or an obsolete request from populating the current view. */
export function useClubLoad<T>(scope: string, load: () => Promise<T>, failure: string) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ scope: string; attempt: number; data?: T; error?: string }>({ scope, attempt: -1 })
  const run = useEffectEvent(load)
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await run()
        if (!cancelled) setState({ scope, attempt, data })
      } catch {
        if (!cancelled) setState({ scope, attempt, error: failure })
      }
    })()
    return () => { cancelled = true }
  }, [scope, attempt, failure])
  const current = state.scope === scope && state.attempt === attempt
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: !current,
    retry: () => setAttempt(value => value + 1),
  }
}
