'use client'

import { useEffect, useRef, useState } from 'react'
import { deleteMandateAction } from '@/app/(dashboard)/mandates/actions'

export type DeleteMandateOperation = typeof deleteMandateAction

export function DeleteMandateDialog({ mandateId, name, onClose, onDeleted, action = deleteMandateAction }: {
  mandateId: string; name: string; onClose: () => void; onDeleted: () => void; action?: DeleteMandateOperation
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  async function remove() {
    if (inFlight.current) return
    inFlight.current = true
    setPending(true)
    setError(null)
    try {
      const result = await action(mandateId)
      if (!result.ok) { setError(result.error); return }
      onDeleted()
    } catch {
      setError('Deletion could not be confirmed. Check your connection and reload the board before retrying.')
    } finally { inFlight.current = false; setPending(false) }
  }
  return <dialog ref={dialogRef} aria-labelledby="delete-mandate-title" aria-describedby="delete-mandate-description"
    onCancel={e => { e.preventDefault(); if (!inFlight.current) onClose() }}
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-5 text-foreground shadow-xl backdrop:bg-black/60">
    <h2 id="delete-mandate-title" className="text-lg font-semibold">Delete {name} mandate?</h2>
    <p id="delete-mandate-description" className="mt-3 text-sm leading-6">This permanently deletes the mandate, its shortlist, assessments, interviews and references. It can’t be undone. Club and coach profiles are kept.</p>
    <p className="mt-2 text-sm text-muted-foreground">Mandates linked to a club brief, a report or confidential access can’t be deleted — close them instead to keep the record.</p>
    {error && <p role="alert" className="mt-3 rounded border border-red-400/40 p-3 text-sm text-red-600">{error}</p>}
    <div className="mt-5 flex flex-wrap justify-end gap-3">
      <button autoFocus type="button" disabled={pending} onClick={onClose} className="rounded border border-border px-4 py-2 text-sm disabled:opacity-50">Cancel</button>
      <button type="button" disabled={pending} onClick={remove} className="rounded bg-destructive px-4 py-2 text-sm text-destructive-foreground disabled:opacity-50">{pending ? 'Deleting…' : 'Delete mandate'}</button>
    </div>
  </dialog>
}
