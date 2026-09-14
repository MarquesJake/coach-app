import { currentEmploymentForApiId, employmentLabel } from '@/lib/scoring/research/current-employment'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'

export function CurrentEmploymentNotice({ name }: { name: string }) {
  const profile = researchProfileForName(name)
  const employment = profile && currentEmploymentForApiId(profile.apiId)
  if (!employment) return null
  return <section className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
    <p className="font-medium">Current job · checked {employment.checkedAt}</p>
    <p className="mt-1">{employmentLabel(employment)}</p>
    <p className="mt-2 text-xs text-muted-foreground">{employment.note}</p>
    {employment.sourceUrl && <a className="mt-2 inline-block text-xs text-primary underline" href={employment.sourceUrl} target="_blank" rel="noreferrer">{employment.sourceTitle || 'Employment source'}</a>}
    <p className="mt-2 text-xs text-muted-foreground">Being in a job tells us nothing about his interest, release terms or cost. Older provider career rows can disagree — the dated source wins.</p>
  </section>
}
