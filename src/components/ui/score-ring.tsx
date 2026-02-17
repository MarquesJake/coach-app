"use client"

import { cn } from "@/lib/utils"

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "#10b981", text: "text-emerald-400", bg: "bg-emerald-400" }
  if (score >= 60) return { stroke: "#eab308", text: "text-yellow-400", bg: "bg-yellow-400" }
  if (score >= 40) return { stroke: "#f97316", text: "text-orange-400", bg: "bg-orange-400" }
  return { stroke: "#ef4444", text: "text-red-400", bg: "bg-red-400" }
}

export function ScoreRing({ score, size = 64, strokeWidth = 4, className, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const colors = getScoreColor(score)

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border/40"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 3px ${colors.stroke}30)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-sm font-bold tabular-nums", colors.text)}>
            {score}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-2xs text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      )}
    </div>
  )
}

export function ScoreBar({
  label,
  score,
  weight,
}: {
  label: string
  score: number
  weight?: string
}) {
  const colors = getScoreColor(score)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          {weight && (
            <span className="text-2xs text-muted-foreground/40">{weight}</span>
          )}
        </div>
        <span className={cn("text-xs font-semibold tabular-nums", colors.text)}>
          {score}
        </span>
      </div>
      <div className="h-1 bg-border/30 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full score-bar-track", colors.bg)}
          style={{ width: `${score}%`, opacity: 0.7 }}
        />
      </div>
    </div>
  )
}

export { getScoreColor }
