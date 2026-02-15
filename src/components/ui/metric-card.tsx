import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  accentColor?: string
  className?: string
}

export function MetricCard({
  icon,
  label,
  value,
  subtitle,
  accentColor = 'text-foreground',
  className,
}: MetricCardProps) {
  return (
    <div className={cn('card-surface rounded-lg px-4 py-3.5', className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground/60">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
          {label}
        </span>
      </div>
      <span className={cn('text-xl font-semibold tabular-nums block', accentColor)}>
        {value}
      </span>
      {subtitle && (
        <span className="text-2xs text-muted-foreground/50 mt-0.5 block">{subtitle}</span>
      )}
    </div>
  )
}
