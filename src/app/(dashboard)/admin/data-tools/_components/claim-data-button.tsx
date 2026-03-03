'use client'

import { useState } from 'react'
import { claimUnownedRowsAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'

export function ClaimDataButton({ totalUnowned }: { totalUnowned: number }) {
  const [loading, setLoading] = useState(false)

  async function handleClaim() {
    setLoading(true)
    try {
      const result = await claimUnownedRowsAction()
      if (result.error) {
        toastError(result.error)
        return
      }
      const msg = [
        result.clubs_claimed ? `${result.clubs_claimed} clubs` : null,
        result.coaches_claimed ? `${result.coaches_claimed} coaches` : null,
      ].filter(Boolean).join(', ')
      toastSuccess(msg ? `Claimed: ${msg}` : 'No unowned rows to claim')
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClaim}
        disabled={loading || totalUnowned === 0}
        className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? 'Claiming…' : 'Claim all unowned rows'}
      </button>
      {totalUnowned === 0 && (
        <span className="text-xs text-muted-foreground">No unowned rows</span>
      )}
    </div>
  )
}
