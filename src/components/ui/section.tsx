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
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            {badge}
            {title && (
              <h3 className="text-sm font-semibold text-foreground">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      {description && (
        <p className="px-5 pt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-sm font-semibold text-foreground", className)}>
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
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium", muted ? "text-muted-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  )
}
