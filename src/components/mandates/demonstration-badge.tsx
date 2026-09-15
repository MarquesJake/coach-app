import { demonstrationLabel } from '@/lib/mandates/demonstration'

/** Permanent label wherever a demonstration mandate or its club appears. Renders nothing for real work. */
export function DemonstrationBadge({ mandateId, clubId, tone = 'light', className = '' }: { mandateId?: string | null; clubId?: string | null; tone?: 'light' | 'dark'; className?: string }) {
  const text = demonstrationLabel({ mandateId, clubId })
  if (!text) return null
  const styles = tone === 'dark'
    ? 'border-amber-300/50 bg-amber-300/10 text-amber-100'
    : 'border-amber-600/30 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-100'
  return <p role="note" className={`rounded border px-2.5 py-1.5 text-xs font-medium leading-5 ${styles} ${className}`}>{text}</p>
}
