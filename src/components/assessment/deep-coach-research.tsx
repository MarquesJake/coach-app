import type { DeepResearchProfile } from '@/lib/coaches/deep-research-types'

/** Source-authored context. Never derives claims, ratings or missing metrics. */
export function DeepCoachResearch({ profile, coachId }: { profile: DeepResearchProfile | null | undefined; coachId?: string }) {
  if (!profile) return null
  const sections = profile.sections.map(section => ({ ...section, points: section.points.filter(point => point.text.trim()) })).filter(section => section.points.length)
  if (!sections.length) return null
  const sources = new Map(profile.sources.map(source => [source.url, source]))
  return <section aria-label={`Deep research: ${profile.name}`} className="my-6 rounded-xl border border-border bg-card p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Football and career context</p>
    <h2 className="mt-2 text-xl font-semibold">Understanding {profile.name} beyond the results</h2>
    <p className="mt-2 text-sm text-muted-foreground">Sourced accounts of the periods below provide context for the match sample. They do not fill missing metrics or establish the coach’s causal impact.</p>
    <p className="mt-2 text-xs text-muted-foreground">Research reviewed {profile.reviewedAt} · {profile.sources.length} listed sources</p>
    <nav aria-label="Research sections" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">{sections.map(section => <a key={section.key} className="text-primary underline underline-offset-4" href={`#deep-${profile.apiId}-${section.key}`}>{section.title}</a>)}</nav>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">{sections.map(section => <section key={section.key} id={`deep-${profile.apiId}-${section.key}`} className="scroll-mt-24 rounded-lg border border-border p-4">
      <h3 className="font-semibold">{section.title}</h3>
      <div className="mt-3 space-y-4">{section.points.map((point, index) => <div key={`${section.key}-${index}`}>
        <p className="text-xs font-medium text-muted-foreground">{point.period}</p>
        <p className="mt-1 text-sm leading-relaxed">{point.text}</p>
        <ul aria-label="Sources for this account" className="mt-2 space-y-1 text-xs">{point.sourceUrls.map(url => {
          const source = sources.get(url)
          return <li key={url}><a href={url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">{source ? `${source.publisher} · ${source.title}` : url}</a></li>
        })}</ul>
      </div>)}</div>
    </section>)}</div>
    {profile.limitations.length > 0 && <aside className="mt-5 rounded-lg bg-muted/50 p-4"><h3 className="text-sm font-semibold">What remains uncertain</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{profile.limitations.map(item => <li key={item}>{item}</li>)}</ul></aside>}
    {coachId && <div className="mt-4 flex flex-wrap gap-4 text-sm"><a className="text-primary underline" href={`/coaches/${coachId}/research`}>Investigate the open questions</a><a className="text-primary underline" href={`/coaches/${coachId}/tactical`}>Football profile</a></div>}
  </section>
}
