'use client'

import { useState } from 'react'
import { clearMyDataAction } from '../actions'
import { CLEAR_CONFIRM_TEXT, validateClearConfirmation } from '../clear-my-data'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

const CONFIRM_PROMPT = 'Type CLEAR below and click the button to permanently delete all of your data. This cannot be undone. Continue?'

export function ClearMyDataButton() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const allowed = validateClearConfirmation(input)

  async function handleClick() {
    if (!allowed || !window.confirm(CONFIRM_PROMPT)) return
    setLoading(true)
    try {
      const result = await clearMyDataAction(input)
      if (!result.ok) {
        toastError(result.error)
        return
      }
      const total = Object.values(result.deletedCounts).reduce((a, b) => a + b, 0)
      const parts = [`${total} rows deleted`]
      if (result.skippedTables.length > 0) {
        parts.push(`Skipped (table missing): ${result.skippedTables.join(', ')}`)
      }
      if (result.errors.length > 0) {
        parts.push(`Errors: ${result.errors.join('; ')}`)
      }
      toastSuccess(parts.join('. '))
      router.refresh()
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[180px]">
        <label htmlFor="clear-confirm" className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
          Type {CLEAR_CONFIRM_TEXT} to enable
        </label>
        <input
          id="clear-confirm"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={CLEAR_CONFIRM_TEXT}
          className="w-full h-10 rounded-lg bg-surface border border-border px-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={`Confirmation: type ${CLEAR_CONFIRM_TEXT}`}
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        onClick={handleClick}
        disabled={!allowed || loading}
        className="inline-flex items-center gap-2"
      >
        {loading ? 'Clearing…' : 'Clear my data'}
      </Button>
    </div>
  )
}
