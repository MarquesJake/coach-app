'use client'

import { useState } from 'react'

export function PrintButton({ mandateId, coachId }: { mandateId: string; coachId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function print() {
    const closed = Array.from(document.querySelectorAll<HTMLDetailsElement>('#board-pack-root details:not([open])'))
    closed.forEach(detail => { detail.open = true })
    window.addEventListener('afterprint', () => closed.forEach(detail => { detail.open = false }), { once: true })
    window.print()
  }
  async function download() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/board-report/${mandateId}/${coachId}`, { method: 'POST' })
      if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) throw new Error('PDF download could not finish. Please try again, or use Print and choose Save as PDF.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${document.title.replace(/[\\/:*?"<>|]/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed. Please use Print and choose Save as PDF.')
    } finally { setBusy(false) }
  }
  return (
    <div className="print:hidden flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button type="button" onClick={print} className="px-3 py-2 border border-border text-xs rounded-md">Print</button>
        <button type="button" onClick={download} disabled={busy} aria-busy={busy} className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-50">
          {busy ? 'Preparing PDF…' : 'Download PDF'}
        </button>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground max-w-sm">{busy ? 'Preparing the complete report. This may take up to a minute.' : 'Downloads an A4 report with all cleared report sections.'}</p>
      {error && <p role="alert" className="text-xs text-red-600 max-w-sm">{error}</p>}
    </div>
  )
}
