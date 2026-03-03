'use client'

import { useRouter } from 'next/navigation'
import { markAlertSeenAction } from '../actions'
import { cn } from '@/lib/utils'

type Alert = {
  id: string
  entity_type: string
  entity_id: string
  alert_type: string
  title: string
  detail: string | null
  created_at: string
  seen: boolean
}

function getHref(a: Alert): string {
  if (a.entity_type === 'coach') return `/coaches/${a.entity_id}`
  if (a.entity_type === 'mandate') return `/mandates/${a.entity_id}`
  return '#'
}

export function AlertRow({ alert }: { alert: Alert }) {
  const router = useRouter()
  const href = getHref(alert)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    await markAlertSeenAction(alert.id)
    if (href !== '#') router.push(href)
  }

  return (
    <li className={cn('py-3 first:pt-0', alert.seen && 'opacity-70')}>
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left flex items-start justify-between gap-2 rounded-md -mx-2 px-2 py-1 hover:bg-muted/50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{alert.alert_type.replace(/_/g, ' ')}</span>
          {alert.title && (
            <p className="text-sm font-medium text-foreground mt-0.5">{alert.title}</p>
          )}
          <p className="text-sm mt-0.5">
            {alert.entity_type === 'coach' && (
              <span className="text-primary hover:underline">Coach profile</span>
            )}
            {alert.entity_type === 'mandate' && (
              <span className="text-primary hover:underline">Mandate</span>
            )}
            {alert.entity_type !== 'coach' && alert.entity_type !== 'mandate' && alert.entity_type}
          </p>
          {alert.detail && (
            <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(alert.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {alert.seen && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Seen</span>
          )}
          {!alert.seen && <span className="w-2 h-2 rounded-full bg-primary" aria-label="Unread" />}
        </div>
      </button>
    </li>
  )
}
