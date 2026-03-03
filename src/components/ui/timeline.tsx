import { getIconForActionType } from '@/lib/constants/activityActions'

export type TimelineItem = {
  id: string
  action_type: string
  description: string
  created_at: string
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  const week = Math.floor(day / 7)
  if (week < 4) return `${week}w ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type TimelineProps = {
  items: TimelineItem[]
  emptyMessage?: string
}

export function Timeline({ items, emptyMessage = 'No activity yet' }: TimelineProps) {
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4">{emptyMessage}</p>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
      <ul className="space-y-0">
        {items.map((item) => {
          const Icon = getIconForActionType(item.action_type)
          return (
            <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
                <Icon className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.action_type.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-foreground mt-0.5">{item.description}</p>
                <p className="text-2xs text-muted-foreground mt-1">{relativeTime(item.created_at)}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
