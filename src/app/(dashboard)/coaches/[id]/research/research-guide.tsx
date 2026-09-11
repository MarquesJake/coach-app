import Link from 'next/link'
import { researchHref, type ResearchContext } from '@/lib/research-context'
import { COACH_RESEARCH_GUIDE } from '@/lib/coach-research-guide'
import { INTERVIEW_QUESTIONS, REFERENCE_QUESTIONS, REFERENCE_GROUP_LABELS, type ReferenceStakeholderGroup } from '@/lib/assessment/question-banks'

export function ResearchGuide({ mandate, context = {}, general = false }: { mandate?: string; context?: ResearchContext; general?: boolean }) {
  const href = (key: string) => researchHref(`/coaches/${context.coach}/research?template=${encodeURIComponent(key)}${general ? '&scope=general' : ''}#new-question`, { ...context, mandate })
  const questionLink = (key: string) => <Link href={href(key)} className="gaffa-link inline-block py-2 text-sm">Use this question →</Link>
  return <details id="assessment-guide" className="gaffa-disclosure gaffa-panel scroll-mt-20">
    <summary className="cursor-pointer font-medium">Assessment guide · nine areas to investigate</summary>
    <p className="gaffa-description mt-3">Go beyond the CV: what has he won, how does he work, how does he lead, and why has he succeeded or struggled? Pick a question, adjust it and add it to the plan.</p>
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
      <p className="mt-3 text-sm text-muted-foreground">Use these as a starting point, then ask for examples specific to the coach and the club. The three that tell you most: disagreeing with the board, handling criticism, and the first 90 days.</p>
      {([{ title: 'Three revealing questions', focus: 'three_revealing' }, { title: 'Core interview', focus: 'standard' }, { title: 'Club-specific preparation', focus: 'club_specific' }] as const).map(group => <details className="gaffa-disclosure mt-4 rounded-lg border border-border p-4" key={group.focus}>
        <summary className="cursor-pointer text-sm font-medium">{group.title}</summary>
        <div className="mt-3 divide-y divide-border">{INTERVIEW_QUESTIONS.filter(q => q.focus === group.focus).map(q => <div key={q.key} className="py-3 text-sm"><p className="font-medium">{q.question}</p><p className="mt-1 text-muted-foreground">{q.followUp}</p>{questionLink(q.key)}</div>)}</div>
      </details>)}
    </details>
    <details className="gaffa-disclosure border-t border-border py-4">
      <summary className="cursor-pointer text-sm font-medium">References · five perspectives and a pattern check</summary>
      <p className="mt-3 text-sm text-muted-foreground">Compare what owners, chief executives, staff, players, industry contacts and journalists say from first-hand experience. Look for patterns and keep the disagreements. A reference is one person’s account, not a fact.</p>
      {(['general', 'owners_ceos', 'coaching_staff', 'players', 'industry_network', 'journalists'] as ReferenceStakeholderGroup[]).map(group => <details className="gaffa-disclosure mt-4 rounded-lg border border-border p-4" key={group}>
        <summary className="cursor-pointer text-sm font-medium">{group === 'general' ? 'Five most valuable questions' : REFERENCE_GROUP_LABELS[group]}</summary>
        <div className="mt-3 divide-y divide-border">{REFERENCE_QUESTIONS.filter(q => q.stakeholderGroup === group).map(q => <div className="py-3 text-sm" key={q.key}><p>{q.question}</p>{questionLink(q.key)}</div>)}</div>
      </details>)}
    </details>
    <details className="gaffa-disclosure border-t border-border py-4">
      <summary className="cursor-pointer text-sm font-medium">Write a useful coach assessment</summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Start with the overall view, strengths and concerns. Then what he needs to succeed, what the deal involves and what still needs checking. Back each point with dated examples and sources, and keep the full detail underneath.</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">For a specific club: the fit, strengths, weaknesses, opportunities, threats, cost and staff, the risks and how to manage them. Then the recommendation, why, and the next step. Don’t put a percentage chance of success on it without a real model behind it.</p>
    </details>
    <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">Based on Gaffa’s June 2026 head-coach assessment method, interview questions and references process. These prompts guide the research — they don’t score the coach or complete the assessment for you.</p>
  </details>
}
