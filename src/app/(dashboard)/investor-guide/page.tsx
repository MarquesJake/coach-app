import Link from 'next/link'
import { INVESTOR_DEMO_SEASON, VERIFIED_EXAMPLES } from '@/lib/demo/verified-examples'
import { VerifiedExampleCard } from '@/components/verified-example-card'

export const metadata = { title: 'Sources and methodology' }


export default function InvestorGuidePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Sources and methodology</p>
        <h1 className="mt-2 font-serif text-3xl">Evidence before recommendations</h1>
        <p className="mt-3 text-sm font-semibold">Season: {INVESTOR_DEMO_SEASON}</p>
        <p className="mt-2 text-sm text-muted-foreground">Current-season scope is limited to the source-backed examples below. Earlier titles, promotions and career events retain their original dates; they are historical context, not 2026/27 results. No complete current-season standings, xG or Elo feed is connected yet.</p>
        <p className="mt-3 text-sm text-muted-foreground">Source check: 6 September 2026. These dated public facts are not proof of current availability, a client relationship or an endorsement.</p>
      </header>
      <section className="space-y-4">
        <h2 className="font-semibold">Source-checked examples, one per tier</h2>
        <p className="text-sm text-muted-foreground">Dated public facts checked against official club and league sources.</p>
        {VERIFIED_EXAMPLES.map(example => <VerifiedExampleCard key={example.coachId} example={example} showProfileLink />)}
      </section>
      <section className="rounded-md border border-border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Why dates matter</h2>
        <p className="text-sm">Bolton Wanderers identified Steven Schumacher as head coach and described their Championship campaign on 21 August 2026. Use this dated fact, not an older League One import.</p>
        <a className="text-sm underline" href="https://www.bwfc.co.uk/news/schumacher-got-keep-improving" target="_blank" rel="noreferrer">Official Bolton report, 21 August 2026</a>
        <p className="text-sm">Ipswich Town announced on 10 June 2026 that Kieran McKenna would step down. An older staff biography alone cannot establish his current employment or availability.</p>
        <a className="text-sm underline" href="https://www.itfc.co.uk/news/2026/june/10/kieran-mckenna-to-step-down-as-ipswich-town-manager/" target="_blank" rel="noreferrer">Official Ipswich announcement, 10 June 2026</a>
      </section>
      <section className="rounded-md border border-border bg-card p-5 text-sm space-y-2">
        <h2 className="font-semibold">What a record does not establish</h2>
        <p>Import dates are not verification dates. Missing availability, salary, references and private submissions remain unknown until they are recorded.</p>
        <p>An assessment counts as reviewed only when it is supported by dated, cited evidence.</p>
        <p>A recorded recommendation is analyst judgement, not independently verified readiness. Season-results strength estimates are proxies, not provider-grade Elo ratings.</p>
      </section>
      <section className="space-y-3 text-sm">
        <h2 className="font-semibold">How Gaffa works</h2>
        <p>Start with the club&apos;s question, not the entire database. Gaffa staff review and connect the inputs; the software does not independently research or appoint a coach.</p>
        <nav aria-label="Workflow" className="flex flex-wrap gap-3 underline"><Link href="/club-briefs">1. Review club brief</Link><Link href="/mandates">2. Mandate and assessment</Link><Link href="/coach-portal">3. Review coach work</Link><Link href="/dossier-orders">4. Controlled release desk</Link></nav>
        <p>Analyst: brief, shortlist, assessment and board report.</p>
        <p>Club director: brief drafting and saving. Coach: own profile and material review.</p>
        <p>Controlled PDF upload, reviewed release, expiry and revocation. Signed links remain usable for up to 60 seconds; view-only access cannot prevent copying.</p>
        <Link className="inline-block underline" href="/mandates">Open the mandate workspace</Link>
      </section>
    </div>
  )
}
