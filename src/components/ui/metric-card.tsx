import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  accentColor?: string
  variant?: 'dark' | 'light'
  className?: string
}

export function MetricCard({
  icon,
  label,
  value,
  subtitle,
  accentColor = 'text-foreground',
  variant = 'dark',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl px-5 py-4',
        variant === 'light'
          ? 'card-light'
          : 'card-surface',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <span className={cn(
          variant === 'light' ? 'text-light-muted/50' : 'text-muted-foreground/50'
        )}>
          {icon}
        </span>
        <span className={cn(
          'text-[10px] font-semibold uppercase tracking-[0.08em]',
          variant === 'light' ? 'text-light-muted/60' : 'text-muted-foreground/60'
        )}>
          {label}
        </span>
      </div>
      <span className={cn(
        'text-xl font-semibold tabular-nums block leading-none',
        variant === 'light' ? 'text-light-fg' : accentColor
      )}>
        {value}
      </span>
      {subtitle && (
        <span className={cn(
          'text-2xs mt-1.5 block',
          variant === 'light' ? 'text-light-muted/60' : 'text-muted-foreground/50'
        )}>
          {subtitle}
        </span>
      )}
    </div>
  )
}
