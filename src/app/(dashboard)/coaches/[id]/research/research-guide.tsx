import Link from 'next/link'
import { researchHref, type ResearchContext } from '@/lib/research-context'
import { COACH_RESEARCH_GUIDE } from '@/lib/coach-research-guide'
import { INTERVIEW_QUESTIONS, REFERENCE_QUESTIONS, REFERENCE_GROUP_LABELS, type ReferenceStakeholderGroup } from '@/lib/assessment/question-banks'

export function ResearchGuide({ mandate, context = {}, general = false }: { mandate?: string; context?: ResearchContext; general?: boolean }) {
  const href = (key: string) => researchHref(`/coaches/${context.coach}/research?template=${encodeURIComponent(key)}${general ? '&scope=general' : ''}#new-question`, { ...context, mandate })
  const questionLink = (key: string) => <Link href={href(key)} className="gaffa-link inline-block py-2 text-sm">Use this question →</Link>
  return <details id="assessment-guide" className="gaffa-disclosure gaffa-panel scroll-mt-20">
    <summary className="cursor-pointer font-medium">Assessment guide · nine areas to investigate</summary>
    <p className="gaffa-description mt-3">Go beyond the CV: what has the coach achieved, how do they work, how do they lead, and why have they succeeded or struggled? Choose a question, tailor it and save it to the research plan.</p>
    <div className="mt-5 divide-y divide-border">
      {COACH_RESEARCH_GUIDE.map((area, index) => <details key={area.key} className="gaffa-disclosure py-4">
        <summary className="cursor-pointer text-sm font-medium"><span className="mr-3 tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>{area.title}</summary>
        <div className="mt-4 space-y-4 sm:pl-8">
          <p className="text-sm font-medium">{area.question}</p>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">{area.topics.map(topic => <li key={topic}>{topic}</li>)}</ul>
          <div className="grid gap-4 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2"><div><h4 className="font-medium">How to investigate</h4><p className="mt-1 leading-relaxed text-muted-foreground">{area.methods}</p></div><div><h4 className="font-medium">What to write up</h4><p className="mt-1 leading-relaxed text-muted-foreground">{area.output}</p></div></div>
          {questionLink(area.key)}
        </div>
      </details>)}
    </div>
    <details className="gaffa-disclosure border-t border-border py-4">
      <summary className="cursor-pointer text-sm font-medium">Candidate interview · 20 questions</summary>
      <p className="mt-3 text-sm text-muted-foreground">Use the supplied questions as a starting point, then ask for examples specific to the coach and club. The three revealing questions cover disagreement with leadership, criticism and the first 90 days.</p>
      {([{ title: 'Three revealing questions', focus: 'three_revealing' }, { title: 'Core interview', focus: 'standard' }, { title: 'Club-specific preparation', focus: 'club_specific' }] as const).map(group => <details className="gaffa-disclosure mt-4 rounded-lg border border-border p-4" key={group.focus}>
        <summary className="cursor-pointer text-sm font-medium">{group.title}</summary>
        <div className="mt-3 divide-y divide-border">{INTERVIEW_QUESTIONS.filter(q => q.focus === group.focus).map(q => <div key={q.key} className="py-3 text-sm"><p className="font-medium">{q.question}</p><p className="mt-1 text-muted-foreground">{q.followUp}</p>{questionLink(q.key)}</div>)}</div>
      </details>)}
    </details>
    <details className="gaffa-disclosure border-t border-border py-4">
      <summary className="cursor-pointer text-sm font-medium">References · five perspectives and a pattern check</summary>
      <p className="mt-3 text-sm text-muted-foreground">Compare first-hand experiences across owners and CEOs, staff, players, industry contacts and journalists. Look for repeated patterns and preserve disagreements. A reference is an attributed account, not an established fact.</p>
      {(['general', 'owners_ceos', 'coaching_staff', 'players', 'industry_network', 'journalists'] as ReferenceStakeholderGroup[]).map(group => <details className="gaffa-disclosure mt-4 rounded-lg border border-border p-4" key={group}>
        <summary className="cursor-pointer text-sm font-medium">{group === 'general' ? 'Five most valuable questions' : REFERENCE_GROUP_LABELS[group]}</summary>
        <div className="mt-3 divide-y divide-border">{REFERENCE_QUESTIONS.filter(q => q.stakeholderGroup === group).map(q => <div className="py-3 text-sm" key={q.key}><p>{q.question}</p>{questionLink(q.key)}</div>)}</div>
      </details>)}
    </details>
    <details className="gaffa-disclosure border-t border-border py-4">
      <summary className="cursor-pointer text-sm font-medium">Write a useful coach assessment</summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Lead with the overall view, strengths and concerns. Explain the conditions for success, practical hiring requirements, and what still needs checking. Support each conclusion with dated examples and sources. Keep full match, training, interview and reference detail behind the summary.</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">For a particular club, explain the fit, strengths, weaknesses, opportunities, threats, financial and staff implications, risks and possible mitigations. State the recommendation, its reasons and the next step. Do not invent a probability of success where there is no defensible model.</p>
    </details>
    <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Based on the supplied June 2026 Head Coach Assessment Methodology, Interview Q&amp;A and References Process. The Albert Riera presentation informs the report structure; its example conclusions, private information and data placeholders are not verified findings for this coach. These prompts do not calculate performance metrics or complete an assessment automatically.</p>
  </details>
}
