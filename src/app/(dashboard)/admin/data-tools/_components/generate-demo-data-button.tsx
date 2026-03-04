'use client'

import { useState } from 'react'
import { seedDemoDataAction } from '../actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { Button } from '@/components/ui/button'

const CONFIRM_MESSAGE =
  'Generate demo data will create or update coaches, clubs, mandates, stints, staff network, intelligence, scores, and similar profiles so every coach tab shows believable content. Safe to run multiple times (idempotent). Continue?'

export function GenerateDemoDataButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!window.confirm(CONFIRM_MESSAGE)) return
    setLoading(true)
    try {
      const result = await seedDemoDataAction()
      if (!result.ok) {
        toastError(result.error)
        return
      }
      const c = result.counts
      const parts = [
        `${c.coaches} coaches`,
        `${c.clubs} clubs`,
        `${c.staff_created} staff`,
        `${c.staff_links_created} staff links`,
        `${c.mandates} mandates`,
        `${c.intelligence_items} intel`,
      ]
      toastSuccess(`Demo data ready: ${parts.join(', ')}`)
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2"
    >
      {loading ? 'Generating…' : 'Generate demo data'}
    </Button>
  )
}
