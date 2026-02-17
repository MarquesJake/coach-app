import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-medium tracking-wide uppercase transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/15",
        secondary: "bg-secondary/80 text-secondary-foreground/70 border-transparent",
        outline: "text-muted-foreground border-border/60 bg-transparent",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/15",
        danger: "bg-red-500/10 text-red-400 border-red-500/15",
        info: "bg-sky-500/10 text-sky-400 border-sky-500/15",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
