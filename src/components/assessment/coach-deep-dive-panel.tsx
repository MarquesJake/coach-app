import { deepDiveFor } from '@/lib/assessment/deep-dive'
import { AREA_DEEP_DIVE, AreaMethodology } from './deep-dive-sections'

// Coach-profile view of the assessment depth: each tab shows the areas that
// belong to it (Career → performance, Football → tactics and training, etc.).
export function CoachDeepDivePanel({ coachId, areas }: { coachId: string; areas: string[] }) {
  const d = deepDiveFor(coachId)
  if (!d) return null
  return <>{areas.map(area => {
    const entry = AREA_DEEP_DIVE[area]
    if (!entry) return null
    return <section key={area} className="gaffa-panel deep-dive">
      <p className="gaffa-eyebrow mb-2">In depth</p>
      <h2 className="gaffa-panel-heading mb-4">{entry.title}</h2>
      {entry.render(d)}
      <AreaMethodology area={area} />
    </section>
  })}</>
}
