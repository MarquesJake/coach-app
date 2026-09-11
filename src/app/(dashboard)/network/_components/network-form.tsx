'use client'

import { useRef, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { prepareNetworkFormData } from '@/lib/network/forms'

export function NetworkForm({ children, action, success, onSaved }: {
  children: ReactNode
  action: (data: FormData) => Promise<{ ok: boolean; error?: string; id?: string }>
  success: string
  onSaved?: (id?: string) => void
}) {
  const router = useRouter()
  const busy = useRef(false)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null)
  return <form className="mt-3 min-w-0" onSubmit={event => {
    event.preventDefault()
    if (busy.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    busy.current = true
    setFeedback(null)
    startTransition(async () => {
      let confirmed = false
      try {
        const result = await action(prepareNetworkFormData(data))
        if (!result.ok) { setFeedback({ error: true, text: result.error || 'Save was not confirmed. Your entries are still here.' }); return }
        confirmed = true
        form.reset()
        setFeedback({ error: false, text: success })
        onSaved?.(result.id)
        router.refresh()
      } catch (error) {
        setFeedback({ error: !confirmed, text: confirmed ? 'Saved, but this view could not refresh. Reload to check the saved record before adding another.' : error instanceof Error && /Choose a valid|Select a network/.test(error.message) ? error.message : 'Save could not be confirmed. Your entries are still here. Check the saved record before retrying.' })
      } finally { busy.current = false }
    })
  }}>
    {feedback && <p role={feedback.error ? 'alert' : 'status'} className={`mb-3 text-sm ${feedback.error ? 'text-destructive' : 'text-foreground'}`}>{feedback.text}</p>}
    <fieldset disabled={pending} className="grid min-w-0 gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-2 disabled:opacity-60">{children}</fieldset>
    {pending && <p role="status" className="mt-2 text-xs text-muted-foreground">Saving...</p>}
  </form>
}
