interface ScoreBarProps {
  score: number
  width?: string
  showLabel?: boolean
}

export function ScoreBar({ score, width = '100px', showLabel = false }: ScoreBarProps) {
  const boundedScore = Math.max(0, Math.min(100, score))

  const getColor = (s: number) => {
    if (s >= 90) return 'bg-emerald-600'
    if (s >= 75) return 'bg-slate-500'
    if (s >= 60) return 'bg-amber-700'
    return 'bg-gray-600'
  }

  const getTextColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500'
    if (s >= 75) return 'text-slate-400'
    if (s >= 60) return 'text-amber-600'
    return 'text-gray-500'
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={`text-sm font-medium ${getTextColor(boundedScore)}`}>{boundedScore}</span>
      )}
      <div className="bg-gray-800/50 rounded h-1.5 overflow-hidden" style={{ width }}>
        <div
          className={`h-full ${getColor(boundedScore)} transition-all duration-500 ease-out`}
          style={{ width: `${boundedScore}%` }}
        />
      </div>
    </div>
  )
}
