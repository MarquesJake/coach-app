import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  variant?: "surface" | "raised" | "inset" | "ghost"
}

export function Section({
  title,
  description,
  badge,
  action,
  variant = "surface",
  className,
  children,
  ...props
}: SectionProps) {
  const variantClasses = {
    surface: "card-surface",
    raised: "card-raised",
    inset: "card-inset",
    ghost: "",
  }

  return (
    <div
      className={cn("rounded-xl overflow-hidden", variantClasses[variant], className)}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            {badge}
            {title && (
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      {description && (
        <p className="px-5 pt-3 text-xs text-muted-foreground leading-relaxed">{description}</p>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70", className)}>
      {children}
    </span>
  )
}

export function DataRow({
  label,
  value,
  muted,
}: {
  label: string
  value: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-medium", muted ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  )
}
