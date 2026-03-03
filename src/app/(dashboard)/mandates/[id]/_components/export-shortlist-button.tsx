'use client'

import { FileDown } from 'lucide-react'
import { toastSuccess } from '@/lib/ui/toast'

export function ExportShortlistButton({ mandateId }: { mandateId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.open(`/mandates/${mandateId}/export/shortlist`, '_blank', 'noopener,noreferrer')
        toastSuccess('Shortlist opened in new window. Use Print to PDF to save.')
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-surface text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      title="Export Mandate Shortlist PDF"
    >
      <FileDown className="w-3.5 h-3.5" />
      Export shortlist
    </button>
  )
}
