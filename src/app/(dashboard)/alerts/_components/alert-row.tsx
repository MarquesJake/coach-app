'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { markAlertSeenAction } from '../actions'
import { alertDestination } from '@/lib/alerts/presentation'
import { cn } from '@/lib/utils'

type Alert = {
  id: string
  entity_type: string
  entity_id: string
  alert_type: string
  title: string
  detail: string | null
  created_at: string
  is_seen: boolean
}

export function AlertRow({ alert }: { alert: Alert }) {
  const router = useRouter()
  const destination = alertDestination(alert.entity_type, alert.entity_id)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const date = new Date(alert.created_at)

  async function markSeen() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError(null)
    try {
      const result = await markAlertSeenAction(alert.id)
      if (result.error) { setError('Could not mark this alert seen. You can still open its record.'); return }
      router.refresh()
    } catch {
      setError('Seen status was not confirmed. Check your connection and retry.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  return (
    <li className={cn('py-4 first:pt-0', alert.is_seen && 'opacity-80')}>
      <article className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{alert.alert_type.replace(/_/g, ' ')}</p>
          <h3 className="mt-1 text-sm font-medium">{alert.title || 'Recorded alert'}</h3>
          {alert.detail && <p className="mt-1 text-sm text-muted-foreground">{alert.detail}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          {destination ? <Link href={destination.href} className="mt-2 inline-flex min-h-10 items-center text-sm text-primary underline">{destination.label}</Link> : <p className="mt-2 text-xs text-muted-foreground">No linked record is available for this alert.</p>}
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        {alert.is_seen ? <span className="text-xs text-muted-foreground">Seen</span> : <button type="button" onClick={markSeen} disabled={pending} className="min-h-10 shrink-0 rounded-md border border-border px-3 text-sm disabled:opacity-50">{pending ? 'Updating...' : 'Mark seen'}</button>}
      </article>
    </li>
  )
}
