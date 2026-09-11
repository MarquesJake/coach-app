import { deepDiveFor, finalEvaluationFor } from '@/lib/assessment/deep-dive'

// Headline numbers from the assessment depth, side by side for the compare page.
export function DeepDiveCompare({ coaches, mandateId }: { coaches: { id: string; name: string | null }[]; mandateId?: string }) {
  const rows = coaches.map(c => ({ c, d: deepDiveFor(c.id), e: mandateId ? finalEvaluationFor(mandateId, c.id) : null })).filter(r => r.d)
  if (rows.length < 2) return null
  const latest = (r: typeof rows[number]) => r.d!.performance.seasons[r.d!.performance.seasons.length - 1]
  const per90 = (x: { transition: number; buildUp: number; restart: number; corners: number; directFk: number; indirectFk: number; throwIns: number }) => x.transition + x.buildUp + x.restart + x.corners + x.directFk + x.indirectFk + x.throwIns
  const metrics: [string, (r: typeof rows[number]) => string][] = [
    ['Latest season', r => `${latest(r).season} · ${latest(r).club}`],
    ['Points per game', r => ((3 * latest(r).w + latest(r).d) / latest(r).played).toFixed(2)],
    ['xG for / against (per 90)', r => `${per90(r.d!.performance.xgFor).toFixed(2)} / ${per90(r.d!.performance.xgAgainst).toFixed(2)}`],
    ['Impact after 20+ games (PPG)', r => r.d!.performance.impact[2]?.ppg.toFixed(2) ?? '—'],
    ['Value for money', r => `Wages ${r.d!.performance.resources.wageRank} · finished ${r.d!.performance.resources.finish}`],
    ['Main formation', r => r.d!.tactical.formations[0]?.shape ?? '—'],
    ['Pressing actions vs league', r => { const m = r.d!.performance.physical.find(p => p.metric === 'Pressing actions'); return m ? `${m.vsLeague > 0 ? '+' : ''}${m.vsLeague}%` : '—' }],
    ['Under-21 minutes', r => r.d!.development.stats.find(s => s.label === 'Under-21 minutes')?.value ?? '—'],
    ['Positive media coverage', r => `${r.d!.media.sentiment.positive}%`],
  ]
  if (rows.some(r => r.e)) metrics.push(['Probability of success', r => r.e ? `${r.e.probabilityOfSuccess}%` : '—'])
  return <section className="deep-dive rounded-lg border border-border bg-card p-4">
    <h2 className="text-sm font-medium">Headline numbers</h2>
    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-xs">
      <thead><tr className="border-b border-border text-left"><th className="py-1.5 font-medium text-muted-foreground" />{rows.map(r => <th key={r.c.id} className="py-1.5 font-semibold">{r.c.name}</th>)}</tr></thead>
      <tbody>{metrics.map(([label, get]) => <tr key={label} className="border-b border-border/60"><td className="py-1.5 pr-3 text-muted-foreground">{label}</td>{rows.map(r => <td key={r.c.id} className="py-1.5 pr-3 tabular-nums">{get(r)}</td>)}</tr>)}</tbody>
    </table></div>
    <p className="mt-2 text-[10px] text-muted-foreground/70">Source: Gaffa data model · indicative.</p>
  </section>
}
