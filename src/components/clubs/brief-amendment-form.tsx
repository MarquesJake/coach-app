'use client'

import { useRef, useState, useTransition, type ReactNode, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BRIEF_FIELDS, BRIEF_FIELD_LABELS, type BriefField, type BriefSnapshot } from '@/lib/clubs/brief-amendments'

type Action = (form: FormData) => Promise<{ error?: string; success?: string }>

// Keep the native form and its inputs mounted on network/server failures.
// Only reset after a confirmed successful write; repeated clicks are locked immediately.
export function ReliableBriefForm({ action, children }: { action: Action; children: ReactNode }) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; success?: string }>({})
  const inFlight = useRef(false)
  const router = useRouter()
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const form = event.currentTarget
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const data = new FormData(form)
    if (submitter instanceof HTMLButtonElement && submitter.name) data.set(submitter.name, submitter.value)
    inFlight.current = true
    startTransition(async () => {
      try {
        const response = await action(data)
        setResult(response)
        if (response.success) { form.reset(); router.refresh() }
      } catch {
        setResult({ error: 'The save was interrupted. Your entries are still here. Check your connection, then retry. If it already reached Gaffa, reload to see the recorded request or decision.' })
      } finally { inFlight.current = false }
    })
  }
  return <form onSubmit={submit} className="space-y-4">
    <fieldset disabled={pending || Boolean(result.success)} className="min-w-0 space-y-4 disabled:opacity-60">{children}</fieldset>
    {pending && <p role="status" className="text-sm">Saving…</p>}
    {result.error && <p role="alert" className="rounded border border-red-300 p-3 text-sm">{result.error}</p>}
    {result.success && <p role="status" className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950">{result.success}</p>}
  </form>
}

export function BriefAmendmentForm({ briefId, version, snapshot, action }: {
  briefId: string; version: number; snapshot: BriefSnapshot; action: Action
}) {
  const [selected, setSelected] = useState<BriefField[]>([])
  return <ReliableBriefForm action={action}>
    <input type="hidden" name="brief_id" value={briefId} />
    <input type="hidden" name="base_version" value={version} />
    <p className="text-sm text-muted-foreground">Select the fields to change in agreed version {version}. An empty optional field requests removal of its current wording.</p>
    <div className="space-y-3">{BRIEF_FIELDS.map(key => <div key={key} className="rounded border border-border p-3">
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="changed_fields" value={key}
        checked={selected.includes(key)} onChange={e => setSelected(values => e.target.checked ? [...values, key] : values.filter(value => value !== key))} />{BRIEF_FIELD_LABELS[key]}</label>
      {selected.includes(key) && <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
        <div><p className="text-xs font-semibold">Current wording</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{snapshot[key] || 'Not supplied'}</p></div>
        <label className="min-w-0 text-xs font-semibold">Proposed wording<textarea name={key} defaultValue={snapshot[key] ?? ''} required={key === 'title' || key === 'role_title'} maxLength={12000} rows={4} className="mt-1 block w-full rounded border border-input bg-background p-2 text-sm font-normal" /></label>
      </div>}
    </div>)}</div>
    <label className="block text-sm font-medium">Why does the brief need to change?<textarea name="request_reason" required maxLength={4000} rows={3} className="mt-1 block w-full rounded border border-input bg-background p-2 font-normal" /></label>
    <button disabled={!selected.length} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Request amendment</button>
  </ReliableBriefForm>
}
