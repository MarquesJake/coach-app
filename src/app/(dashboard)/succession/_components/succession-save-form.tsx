'use client'

import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { saveSuccessionPlanAction } from '../actions'

export function SuccessionSaveForm({ children }: { children: ReactNode }) {
  const router = useRouter()
  const lock = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lock.current) return
    const data = new FormData(event.currentTarget)
    lock.current = true
    setPending(true)
    setSaved(false)
    setError(null)
    try {
      const result = await saveSuccessionPlanAction(data)
      if (result.error) { setError(result.error); return }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Save could not be confirmed. Your draft is kept. Check the saved plan before retrying.')
    } finally { lock.current = false; setPending(false) }
  }

  return <form onSubmit={submit} onChange={() => setSaved(false)} aria-busy={pending} className="rounded-lg border border-border bg-card p-4">
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    {saved && <p role="status" className="mb-3 text-sm">Succession plan saved.</p>}
    <fieldset disabled={pending} className="min-w-0">
      {children}
      <button type="submit" className="mt-3 w-full rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled={pending}>
        {pending ? 'Saving plan...' : error ? 'Retry save plan' : 'Save plan'}
      </button>
    </fieldset>
  </form>
}
