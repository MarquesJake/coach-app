'use client'

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isIllustrativeEvidence, isVerifiedEvidence } from '@/lib/assessment/evidence-integrity'
import { deriveAssessmentStatus } from '@/lib/assessment/status'
import type { DeepDive, FinalEvaluation } from '@/lib/assessment/deep-dive'
import { AreaDeepDive, FinalEvaluationSection } from '@/components/assessment/deep-dive-sections'
import { deriveMaterialStatus, summarizeMaterials } from '@/lib/assessment/material-status'
import {
  ASSESSMENT_CRITERIA,
  DIRECT_ASSESSMENT_EVIDENCE_METHOD_KEYS,
  EVIDENCE_METHODS,
  RECOMMENDATION_VERDICTS,
  methodLabel,
  type CriterionKey,
} from '@/lib/assessment/criteria'
import type { DerivedEvidence } from '@/lib/assessment/derived-evidence'
import type { GbeResult } from '@/lib/analysis/gbe'
import {
  saveAssessmentAction,
  addEvidenceAction,
  addInterviewAnswerAction,
  addPrivateMaterialAction,
  addReferenceAnswerAction,
  requestConfidentialAccessAction,
  setEvidenceVerificationAction,
  setEvidenceRecommendationUseAction,
  deleteEvidenceAction,
  saveRecommendationAction,
  updateConfidentialAccessStatusAction,
} from '../../actions'
import {
  INTERVIEW_FOCUS_LABELS,
  INTERVIEW_QUESTIONS,
  REFERENCE_GROUP_LABELS,
  REFERENCE_QUESTIONS,
  type InterviewFocus,
} from '@/lib/assessment/question-banks'
import { INTERVIEW_PLAN, INTERVIEW_STATUS_LABELS, PRIORITY_REFERENCE_KEYS, STAKEHOLDER_GROUPS, boardCall, dimensionFor, interviewStatus, methodCoverage, referencePatterns, referenceQuestionsFor } from '@/lib/assessment/methodology'

export type AssessmentRow = {
  criterion: string
  score: number | null
  summary: string | null
  status: string
}

export type EvidenceRow = {
  id: string
  criterion: string
  method: string
  title: string
  detail: string | null
  source: string | null
  confidence: number | null
  verification_status: string
  used_in_recommendation: boolean
  created_at: string
}

export type RecommendationRow = {
  verdict: string | null
  confidence: number | null
  summary: string | null
  key_strengths: string | null
  key_risks: string | null
  mitigation: string | null
}

export type InterviewAnswerRow = {
  id: string
  question_key: string
  question: string
  answer: string
  criterion: string
  interview_focus: string
  interviewer: string | null
  confidence: number | null
  created_at: string
  verification_status: string | null
  used_in_recommendation: boolean | null
}

export type ReferenceAnswerRow = {
  id: string
  stakeholder_group: string
  reference_name: string | null
  reference_role: string | null
  question_key: string
  question: string
  answer: string
  criterion: string
  confidence: number | null
  would_hire_again: string
  risk_flag: boolean
  created_at: string
  verification_status: string | null
  used_in_recommendation: boolean | null
}

export type PrivateMaterialRow = {
  id: string
  title: string
  material_type: string
  description: string | null
  external_url: string | null
  source_label: string | null
  uploaded_by: string
  confidentiality_status: string
  verification_status: string
  storage_path: string | null
  upload_status: string
  created_at: string
}

export type ConfidentialAccessRequestRow = {
  id: string
  requested_by: string | null
  requester_role: string | null
  club_context: string | null
  request_reason: string
  status: string
  requested_at: string
  decided_at: string | null
}

const inputClass =
  'w-full px-2.5 py-1.5 bg-surface border border-border rounded-md text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors'

type SubmitAction = (action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>) => (event: FormEvent<HTMLFormElement>) => void

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  presentation: 'Coach presentation',
  training_video: 'Training video',
  match_video: 'Match video',
  methodology: 'Methodology',
  analysis: 'Analyst file',
  media: 'Media / speaking',
  reference_pack: 'Reference pack',
  other: 'Other',
}

const ACCESS_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  requested: 'Requested',
  approved: 'Approved',
  shared: 'Shared',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

export type BriefContext = {
  clubName: string
  objective: string | null
  identity: string | null
  squadProblem: string | null
  leadership: string | null
  successMeasures: string | null
  analystBrief: boolean
}

function ProcessOverview({ briefContext, interviewAnswers, referenceAnswers, verdict }: { briefContext: BriefContext | null; interviewAnswers: InterviewAnswerRow[]; referenceAnswers: ReferenceAnswerRow[]; verdict: string | null }) {
  const status = interviewStatus(interviewAnswers)
  const patterns = referencePatterns(referenceAnswers)
  const call = boardCall(verdict)
  const groupCount = (group: string) => referenceAnswers.filter(answer => answer.stakeholder_group === group).length
  return (
    <div className="card-surface rounded-lg p-5 space-y-4 lg:col-span-2">
      <div>
        <h3 className="text-sm font-semibold text-foreground">The people side of the assessment</h3>
        <p className="text-2xs text-muted-foreground mt-0.5">Interview and references follow the same standard questions for every coach, so answers can be compared. Nothing counts until an analyst has checked it.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border border-border/50 bg-surface/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Candidate interview</p>
          <p className="mt-1 text-xs font-medium text-foreground">{INTERVIEW_STATUS_LABELS[status]}</p>
          <p className="mt-1 text-2xs text-muted-foreground">{INTERVIEW_PLAN.standard.length + INTERVIEW_PLAN.revealing.length} standard questions · {INTERVIEW_PLAN.clubSpecific.length} about {briefContext?.clubName ?? 'this club'} · {interviewAnswers.length} answered</p>
        </div>
        <div className="rounded border border-border/50 bg-surface/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">References</p>
          <p className="mt-1 text-xs font-medium text-foreground">{patterns.independentReferences} independent {patterns.independentReferences === 1 ? 'voice' : 'voices'} checked · {patterns.unreviewedAnswers} answer{patterns.unreviewedAnswers === 1 ? '' : 's'} waiting for review</p>
          <p className="mt-1 text-2xs text-muted-foreground">{STAKEHOLDER_GROUPS.map(group => `${REFERENCE_GROUP_LABELS[group]} ${groupCount(group)}`).join(' · ')}</p>
        </div>
        <div className="rounded border border-border/50 bg-surface/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Pattern check · the five questions</p>
          <p className="mt-1 text-xs font-medium text-foreground">{patterns.priorityAnswered} of {PRIORITY_REFERENCE_KEYS.length} answered by a checked reference · would hire again: {patterns.hireAgain}</p>
          <p className="mt-1 text-2xs text-muted-foreground">{patterns.oneVoice ? 'One voice so far — a pattern needs at least two independent references.' : patterns.risksFlagged ? `${patterns.risksFlagged} risk${patterns.risksFlagged === 1 ? '' : 's'} flagged by references.` : 'No risks flagged by checked references yet.'}</p>
        </div>
      </div>
      <p className="text-2xs text-muted-foreground">Board call from the analyst verdict: <span className="font-semibold text-foreground">{call.call}</span> — {call.meaning}</p>
    </div>
  )
}

function StructuredInterviewPanel({
  mandateId,
  coachId,
  answers,
  submit,
  isPending,
  highlightedId,
  briefContext,
}: {
  mandateId: string
  coachId: string
  answers: InterviewAnswerRow[]
  submit: SubmitAction
  isPending: boolean
  highlightedId: string | null
  briefContext: BriefContext | null
}) {
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const recent = answers.slice(0, 3)
  const highlighted = highlightedId ? answers.find((answer) => answer.id === highlightedId) : null
  const visible = highlighted && !recent.some((answer) => answer.id === highlighted.id) ? [highlighted, ...recent] : recent

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedId])

  return (
    <div className="card-surface rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Candidate interview</h3>
        <p className="text-2xs text-muted-foreground mt-0.5">
          The same questions for every coach; the last five are about {briefContext?.clubName ?? 'this club'}. Status: {INTERVIEW_STATUS_LABELS[interviewStatus(answers)]}.
        </p>
      </div>

      <details className="rounded border border-border/50 bg-surface/40 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-foreground">Interview plan · {INTERVIEW_PLAN.standard.length + INTERVIEW_PLAN.revealing.length + INTERVIEW_PLAN.clubSpecific.length} questions</summary>
        {briefContext && (
          <div className="mt-2 rounded border border-primary/30 bg-primary/5 px-3 py-2 text-2xs">
            <p className="font-semibold text-foreground">What the coach is being interviewed against{briefContext.analystBrief ? ' — analyst demonstration brief, not the club’s words' : ''}</p>
            {briefContext.objective && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Objective:</span> {briefContext.objective}</p>}
            {briefContext.identity && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Football:</span> {briefContext.identity}</p>}
            {briefContext.squadProblem && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Squad:</span> {briefContext.squadProblem}</p>}
            {briefContext.leadership && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Who he would answer to:</span> {briefContext.leadership}</p>}
            {briefContext.successMeasures && <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">What success looks like:</span> {briefContext.successMeasures}</p>}
          </div>
        )}
        <div className="mt-2 space-y-2 text-2xs">
          <p className="font-semibold text-foreground">The three that tell you most</p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">{INTERVIEW_PLAN.revealing.map(question => <li key={question.key}>{question.question} <span className="text-muted-foreground/70">— {question.followUp}</span></li>)}</ol>
          <p className="font-semibold text-foreground">Standard questions</p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">{INTERVIEW_PLAN.standard.map(question => <li key={question.key}>{question.question}</li>)}</ol>
          <p className="font-semibold text-foreground">About {briefContext?.clubName ?? 'this club'}</p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">{INTERVIEW_PLAN.clubSpecific.map(question => <li key={question.key}>{question.question.replace(/our club|this club/g, briefContext?.clubName ?? 'this club').replace(/our current squad/g, `the current ${briefContext?.clubName ?? 'club'} squad`)} <span className="text-muted-foreground/70">— {question.followUp}</span></li>)}</ol>
          <p className="text-muted-foreground/80">No interview has been held with this coach{answers.length ? ' beyond the answers recorded below' : ''}. Answers are typed in as given, with the interviewer and date, and only count once checked.</p>
        </div>
      </details>

      <form onSubmit={submit(addInterviewAnswerAction)} className="space-y-2">
        <input type="hidden" name="mandate_id" value={mandateId} />
        <input type="hidden" name="coach_id" value={coachId} />
        <div className="grid grid-cols-[1fr_130px] gap-2">
          <select name="question_key" defaultValue="iq_sporting_director_conflict" className={inputClass}>
            {INTERVIEW_QUESTIONS.map((question) => (
              <option key={question.key} value={question.key}>
                {INTERVIEW_FOCUS_LABELS[question.focus]} — {question.label}
              </option>
            ))}
          </select>
          <input name="confidence" type="number" min={0} max={100} placeholder="Conf." className={inputClass} />
        </div>
        <input name="interviewer" placeholder="Interviewer (optional)" className={inputClass} />
        <textarea name="custom_question" rows={2} maxLength={1000} aria-label="Bespoke interview question" placeholder="Optional: replace the template with the exact club-specific question asked" className={inputClass} />
        <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" name="review_confirmed" value="true" />I have checked where this answer came from and that it is accurate. Otherwise it is saved as unconfirmed background.</label>
        <textarea
          name="answer"
          rows={4}
          required
          placeholder="His answer, your football judgement and any follow-up needed..."
          className={inputClass}
        />
        <select name="used_in_recommendation" defaultValue="true" className={inputClass}>
          <option value="true">Counts toward recommendation</option>
          <option value="false">Background only — exclude from recommendation</option>
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-surface border border-border text-xs font-medium text-foreground rounded-md hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          Add interview evidence
        </button>
      </form>

      <div className="border-t border-border/50 pt-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Recent interview evidence
        </p>
        {visible.length === 0 ? (
          <p className="text-2xs text-muted-foreground">
            No interview answers yet. Start with the three questions that tell you most before the board signs off.
          </p>
        ) : (
          visible.map((answer) => {
            const isHighlighted = answer.id === highlightedId
            return (
            <div
              key={answer.id}
              id={`interview-${answer.id}`}
              ref={isHighlighted ? highlightRef : undefined}
              className={cn(
                'rounded border border-border/50 bg-surface/40 px-3 py-2',
                isHighlighted && 'border-primary/60 bg-primary/10 ring-1 ring-primary/20'
              )}
            >
              <p className="text-xs font-medium text-foreground">{answer.question}</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                {INTERVIEW_FOCUS_LABELS[answer.interview_focus as InterviewFocus] ?? answer.interview_focus}
                {answer.interviewer ? ` · ${answer.interviewer}` : ''}
                {answer.confidence !== null ? ` · confidence ${answer.confidence}` : ''}
              </p>
              <p className="text-2xs text-muted-foreground mt-1 line-clamp-2">{answer.answer}</p>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function StructuredReferencesPanel({
  mandateId,
  coachId,
  answers,
  submit,
  isPending,
  highlightedId,
}: {
  mandateId: string
  coachId: string
  answers: ReferenceAnswerRow[]
  submit: SubmitAction
  isPending: boolean
  highlightedId: string | null
}) {
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const recent = answers.slice(0, 3)
  const highlighted = highlightedId ? answers.find((answer) => answer.id === highlightedId) : null
  const visible = highlighted && !recent.some((answer) => answer.id === highlighted.id) ? [highlighted, ...recent] : recent

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedId])

  return (
    <div className="card-surface rounded-lg p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Reference process</h3>
        <p className="text-2xs text-muted-foreground mt-0.5">
          Standard questions for each type of person, so what owners, staff, players, the industry and journalists say can be compared like for like.
        </p>
      </div>

      <details className="rounded border border-border/50 bg-surface/40 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-foreground">Question sets by who you are speaking to</summary>
        <div className="mt-2 space-y-2 text-2xs">
          <p className="font-semibold text-foreground">The five to ask everyone</p>
          <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">{PRIORITY_REFERENCE_KEYS.map(key => { const question = REFERENCE_QUESTIONS.find(item => item.key === key); return question ? <li key={key}>{question.question}</li> : null })}</ol>
          {STAKEHOLDER_GROUPS.map(group => (
            <details key={group} className="rounded border border-border/40 px-2 py-1">
              <summary className="cursor-pointer font-medium text-foreground">{REFERENCE_GROUP_LABELS[group]} · {referenceQuestionsFor(group).length} questions · {answers.filter(answer => answer.stakeholder_group === group).length} answered</summary>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-muted-foreground">{referenceQuestionsFor(group).map(question => <li key={question.key}>{question.question}</li>)}</ol>
            </details>
          ))}
          <p className="text-muted-foreground/80">Every answer keeps its original wording, who said it, when, and whether an analyst has checked it. One person is an opinion; the same point from two independent people is a pattern; disagreement is shown, not averaged.</p>
        </div>
      </details>

      <form onSubmit={submit(addReferenceAnswerAction)} className="space-y-2">
        <input type="hidden" name="mandate_id" value={mandateId} />
        <input type="hidden" name="coach_id" value={coachId} />
        <select name="question_key" defaultValue="rq_biggest_risk" className={inputClass}>
          {REFERENCE_QUESTIONS.map((question) => (
            <option key={question.key} value={question.key}>
              {REFERENCE_GROUP_LABELS[question.stakeholderGroup]} — {question.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input name="reference_name" placeholder="Reference name" className={inputClass} />
          <input name="reference_role" placeholder="Role / relationship" className={inputClass} />
        </div>
        <textarea name="custom_question" rows={2} maxLength={1000} aria-label="Bespoke reference question" placeholder="Optional: replace the template with the exact question asked" className={inputClass} />
        <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" name="review_confirmed" value="true" />I have checked where this answer came from and that it is accurate. Otherwise it is saved as unconfirmed background.</label>
        <textarea
          name="answer"
          rows={4}
          required
          placeholder="Note the pattern, not just the quote. What would matter in this dressing room?"
          className={inputClass}
        />
        <div className="grid grid-cols-[1fr_110px] gap-2">
          <select name="would_hire_again" defaultValue="unknown" className={inputClass}>
            <option value="unknown">Would hire/work again unknown</option>
            <option value="yes">Would hire/work again: yes</option>
            <option value="mixed">Would hire/work again: mixed</option>
            <option value="no">Would hire/work again: no</option>
          </select>
          <input name="confidence" type="number" min={0} max={100} placeholder="Conf." className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select name="risk_flag" defaultValue="false" className={inputClass}>
            <option value="false">No risk flag</option>
            <option value="true">Risk flagged</option>
          </select>
          <select name="used_in_recommendation" defaultValue="true" className={inputClass}>
            <option value="true">Counts toward recommendation</option>
            <option value="false">Background only</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 bg-surface border border-border text-xs font-medium text-foreground rounded-md hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          Add reference evidence
        </button>
      </form>

      <div className="border-t border-border/50 pt-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Recent reference evidence
        </p>
        {visible.length === 0 ? (
          <p className="text-2xs text-muted-foreground">
            No references yet. Use the five key questions to find the strengths, weaknesses and risks that keep coming up.
          </p>
        ) : (
          visible.map((answer) => {
            const isHighlighted = answer.id === highlightedId
            return (
            <div
              key={answer.id}
              id={`reference-${answer.id}`}
              ref={isHighlighted ? highlightRef : undefined}
              className={cn(
                'rounded border border-border/50 bg-surface/40 px-3 py-2',
                isHighlighted && 'border-primary/60 bg-primary/10 ring-1 ring-primary/20'
              )}
            >
              <p className="text-xs font-medium text-foreground">{answer.question}</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                {/demo|fictional/i.test(`${answer.reference_name ?? ''} ${answer.answer}`) && <span className="mr-1.5 rounded bg-amber-500/15 px-1 font-semibold text-amber-300">DEMO · fictional</span>}
                <span className={answer.verification_status === 'verified' ? 'text-emerald-300' : 'text-amber-300'}>{answer.verification_status === 'verified' ? (answer.used_in_recommendation ? 'Checked · counts' : 'Checked · background') : 'Draft · waiting for review'}</span>
                {' · '}
                {REFERENCE_GROUP_LABELS[answer.stakeholder_group as keyof typeof REFERENCE_GROUP_LABELS] ?? answer.stakeholder_group}
                {answer.reference_name ? ` · ${answer.reference_name}` : ''}
                {answer.risk_flag ? ' · risk flagged' : ''}
                {answer.confidence !== null ? ` · confidence ${answer.confidence}` : ''}
              </p>
              <p className="text-2xs text-muted-foreground mt-1 line-clamp-2">{answer.answer}</p>
            </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ConfidentialDataRoomPanel({
  mandateId,
  coachId,
  materials,
  accessRequests,
  submit,
  isPending,
}: {
  mandateId: string
  coachId: string
  materials: PrivateMaterialRow[]
  accessRequests: ConfidentialAccessRequestRow[]
  submit: SubmitAction
  isPending: boolean
}) {
  const latestRequest = accessRequests[0]
  const materialSummary = summarizeMaterials(materials)

  return (
    <div className="card-surface rounded-lg p-5 space-y-4 border-l-2 border-emerald-500/50">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/80">
            Confidential coach material
          </p>
          <h3 className="text-sm font-semibold text-foreground mt-1">The detail behind the assessment</h3>
          <p className="text-2xs text-muted-foreground mt-1 max-w-2xl">
            Log the coach’s presentations, training video, methods and our analysts’ files. Clubs request access here when they want more than the assessment report.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-border/50 bg-surface/40 px-2 py-2">
            <p className="text-lg font-semibold text-foreground tabular-nums">{materials.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Entries</p>
          </div>
          <div className="rounded-md border border-border/50 bg-surface/40 px-2 py-2">
            <p className="text-lg font-semibold text-foreground tabular-nums">{materialSummary.uploaded}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Uploaded files</p>
          </div>
          <div className="rounded-md border border-border/50 bg-surface/40 px-2 py-2">
            <p className="text-lg font-semibold text-foreground tabular-nums">{materialSummary.reviewedUploads}</p>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Reviewed uploads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <form onSubmit={submit(addPrivateMaterialAction)} className="space-y-2 rounded-md border border-border/50 bg-surface/30 p-3">
          <input type="hidden" name="mandate_id" value={mandateId} />
          <input type="hidden" name="coach_id" value={coachId} />
          <p className="text-xs font-semibold text-foreground">Log material metadata or a link</p>
          <p className="text-2xs text-muted-foreground">This form doesn’t upload a file or give anyone access.</p>
          <div className="grid grid-cols-[1fr_150px] gap-2">
            <input name="title" required placeholder="e.g. Coach methodology deck" className={inputClass} />
            <select name="material_type" defaultValue="presentation" className={inputClass}>
              {Object.entries(MATERIAL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <textarea
            name="description"
            rows={3}
            placeholder="What’s in it, why it matters and what it shows about the coach..."
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2">
            <input name="external_url" placeholder="Secure link (optional)" className={inputClass} />
            <input name="source_label" placeholder="Source / owner" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="uploaded_by" defaultValue="analyst" className={inputClass}>
              <option value="coach">Coach supplied</option>
              <option value="analyst">Analyst supplied</option>
              <option value="agent">Agent supplied</option>
              <option value="club">Club supplied</option>
              <option value="unknown">Unknown source</option>
            </select>
            <select name="confidentiality_status" defaultValue="available" className={inputClass}>
              <option value="available">Available for controlled access</option>
              <option value="requested">Requested from coach / agent</option>
              <option value="missing">Missing</option>
              <option value="withheld">Withheld</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-surface border border-border text-xs font-medium text-foreground rounded-md hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            Add material
          </button>
        </form>

        <form onSubmit={submit(requestConfidentialAccessAction)} className="space-y-2 rounded-md border border-border/50 bg-surface/30 p-3">
          <input type="hidden" name="mandate_id" value={mandateId} />
          <input type="hidden" name="coach_id" value={coachId} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-foreground">Confidential access request</p>
            {latestRequest && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                Latest: {ACCESS_STATUS_LABELS[latestRequest.status] ?? latestRequest.status}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="requested_by" placeholder="Requester" className={inputClass} />
            <input name="requester_role" placeholder="Role (owner / CEO / SD)" className={inputClass} />
          </div>
          <input name="club_context" placeholder="Club context / decision stage" className={inputClass} />
          <textarea
            name="request_reason"
            rows={4}
            required
            placeholder="Why does the club need to see this now? What decision would it help them make?"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Request confidential access
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-border/50 pt-3">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Private material
          </p>
          {materials.length === 0 ? (
            <p className="text-2xs text-muted-foreground">
              No private material yet. The coach’s presentations, training sessions and methods go here.
            </p>
          ) : (
            materials.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded border border-border/50 bg-surface/40 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                      {MATERIAL_TYPE_LABELS[item.material_type] ?? item.material_type}
                      {item.source_label ? ` · ${item.source_label}` : ''}
                      {item.uploaded_by ? ` · ${item.uploaded_by}` : ''}
                    </p>
                    {item.description && <p className="text-2xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                  </div>
                  <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {deriveMaterialStatus(item).label}
                  </span>
                </div>
                <p className="mt-1 text-2xs text-muted-foreground">{deriveMaterialStatus(item).releaseLabel}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Access log
          </p>
          {accessRequests.length === 0 ? (
            <p className="text-2xs text-muted-foreground">
              No access requests yet. Use this when a club is serious and wants to see more.
            </p>
          ) : (
            accessRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="rounded border border-border/50 bg-surface/40 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {request.requested_by || 'Internal request'}
                      {request.requester_role ? ` · ${request.requester_role}` : ''}
                    </p>
                    <p className="text-2xs text-muted-foreground mt-1 line-clamp-2">{request.request_reason}</p>
                    {request.club_context && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{request.club_context}</p>
                    )}
                  </div>
                  <form onSubmit={submit(updateConfidentialAccessStatusAction)} className="shrink-0">
                    <input type="hidden" name="request_id" value={request.id} />
                    <input type="hidden" name="mandate_id" value={mandateId} />
                    <input type="hidden" name="coach_id" value={coachId} />
                    <select
                      name="status"
                      defaultValue={request.status}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="text-2xs bg-surface border border-border rounded px-1.5 py-1 text-foreground"
                    >
                      {Object.entries(ACCESS_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function AssessmentWorkspaceClient({
  mandateId,
  coachId,
  coachName,
  coachProvenance,
  assessments,
  evidence,
  derived,
  recommendation,
  interviewAnswers,
  referenceAnswers,
  privateMaterials,
  accessRequests,
  gbe,
  coachingLicence,
  deepDive = null,
  finalEvaluation = null,
  briefContext = null,
}: {
  mandateId: string
  coachId: string
  coachName: string
  coachProvenance: { due_diligence_summary: string | null; compliance_notes: string | null }
  assessments: AssessmentRow[]
  evidence: EvidenceRow[]
  derived: DerivedEvidence[]
  recommendation: RecommendationRow | null
  interviewAnswers: InterviewAnswerRow[]
  referenceAnswers: ReferenceAnswerRow[]
  privateMaterials: PrivateMaterialRow[]
  accessRequests: ConfidentialAccessRequestRow[]
  gbe: GbeResult
  coachingLicence: string | null
  deepDive?: DeepDive | null
  finalEvaluation?: FinalEvaluation | null
  briefContext?: BriefContext | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const queryCriterion = searchParams.get('criterion')
  const initialCriterion = ASSESSMENT_CRITERIA.some((criterion) => criterion.key === queryCriterion)
    ? queryCriterion as CriterionKey
    : 'coach_profile'
  const highlightedEvidenceId = searchParams.get('evidence')
  const highlightedInterviewId = searchParams.get('interview')
  const highlightedReferenceId = searchParams.get('reference')
  const highlightedEvidenceRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<CriterionKey>(initialCriterion)
  const [workspaceSection, setWorkspaceSection] = useState<
    'criteria' | 'human' | 'materials' | 'recommendation'
  >(
    highlightedInterviewId || highlightedReferenceId
      ? 'human'
      : highlightedEvidenceId || queryCriterion
        ? 'criteria'
        : 'criteria'
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ASSESSMENT_CRITERIA.some((criterion) => criterion.key === queryCriterion)) {
      setSelected(queryCriterion as CriterionKey)
    }
  }, [queryCriterion])

  useEffect(() => {
    if (highlightedEvidenceId && highlightedEvidenceRef.current) {
      highlightedEvidenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightedEvidenceId, selected])

  const assessmentByCriterion = useMemo(
    () => new Map(assessments.map((a) => [a.criterion, a])),
    [assessments]
  )

  const cellCounts = useMemo(() => {
    const counts = new Map<string, { manual: number; verified: number; auto: number }>()
    const bump = (criterion: string, method: string, kind: 'manual' | 'verified' | 'auto') => {
      const key = `${criterion}:${method}`
      const cell = counts.get(key) ?? { manual: 0, verified: 0, auto: 0 }
      cell[kind] += 1
      counts.set(key, cell)
    }
    for (const item of evidence) {
      bump(item.criterion, item.method, 'manual')
      if (!isIllustrativeEvidence(coachProvenance) && isVerifiedEvidence(item)) bump(item.criterion, item.method, 'verified')
    }
    for (const item of derived) bump(item.criterion, item.method, 'auto')
    return counts
  }, [evidence, derived, coachProvenance])

  const status = deriveAssessmentStatus({ coach: coachProvenance, assessments, evidence, recommendation })
  const coveredCriteria = new Set(status.reviewedCriteria)

  const submit = (action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>) =>
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isPending) return
      const formData = new FormData(event.currentTarget)
      setError(null)
      startTransition(async () => {
        try {
          const result = await action(formData)
          if (!result.ok) setError(result.error ?? 'Something went wrong')
          else router.refresh()
        } catch {
          setError('Save could not be confirmed. Your entries are still here. Check your connection and the saved record before retrying.')
        }
      })
    }

  // Board-readable summary: what the evidence supports, where the gaps are,
  // and where the decision stands — legible in ten seconds.
  const strongCriteria = ASSESSMENT_CRITERIA.filter((c) => {
    const a = assessmentByCriterion.get(c.key)
    return a?.status === 'complete' && !isIllustrativeEvidence(a) && a.score !== null && a.score >= 70 && coveredCriteria.has(c.key)
  })
  const gapCriteria = ASSESSMENT_CRITERIA.filter((c) => !coveredCriteria.has(c.key))

  const selectedAssessment = assessmentByCriterion.get(selected)
  const selectedEvidence = evidence.filter((e) => e.criterion === selected)
  const selectedDerived = derived.filter((d) => d.criterion === selected)
  const selectedMeta = ASSESSMENT_CRITERIA.find((c) => c.key === selected)!

  return (
    <div className="mt-5 space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Reviewed evidence</p>
          <p className="text-lg font-semibold text-foreground mt-0.5 tabular-nums">
            {status.reviewedLabel}
          </p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Recorded assessments</p>
          <p className="text-lg font-semibold text-foreground mt-0.5 tabular-nums">
            {status.recordedLabel}
          </p>
        </div>
        <div className="card-surface rounded-lg px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Work-permit note</p>
          <p
            className={cn(
              'text-sm font-medium mt-1',
              gbe.status === 'Pass' ? 'text-emerald-400/90' : 'text-muted-foreground'
            )}
          >
            {gbe.status === 'Pass'
              ? 'GBE auto-pass indicated on recorded data'
              : gbe.status === 'Fail'
                ? 'GBE auto-pass not confirmed on recorded data'
                : 'Requires legal / work-permit confirmation'}
          </p>
          <p className="text-2xs text-muted-foreground mt-0.5">
            {gbe.passRoute ?? (coachingLicence ? `Licence: ${coachingLicence}` : 'Licence not recorded')}
          </p>
        </div>
      </div>

      {/* Board summary — the ten-second read */}
      <div className="card-surface rounded-lg px-5 py-3.5 border-l-2 border-primary/60">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-x-8 gap-y-1.5 items-start">
          <p className="text-2xs text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/90 mr-2">Assessed with verified records</span>
            {strongCriteria.length > 0 ? strongCriteria.map((c) => c.label).join(', ') : 'None assessed yet'}
          </p>
          <p className="text-2xs text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500/90 mr-2">Evidence gaps</span>
            {gapCriteria.length > 0 ? gapCriteria.map((c) => c.label).join(', ') : 'Every area has confirmed evidence — now check there is enough and resolve any disagreements'}
          </p>
          <p className="text-2xs text-muted-foreground lg:text-right">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-2">Decision confidence</span>
            <span className="text-foreground font-semibold tabular-nums">
              {status.confidence !== null ? `${status.confidence}% (human judgement)` : 'Not recorded'}
            </span>
          </p>
        </div>
        <p className="text-2xs text-muted-foreground mt-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-2">Recommendation</span>
          {status.recommendationLabel}
          {status.recommendationRecorded && recommendation?.summary ? ` · ${recommendation.summary}` : ''}
        </p>
      </div>

      <div className="flex flex-col gap-3 border-y border-border py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {[
            { key: 'criteria', label: 'Criteria & evidence' },
            { key: 'human', label: `Interview & references (${interviewAnswers.length + referenceAnswers.length})` },
            { key: 'materials', label: `Private materials (${privateMaterials.length})` },
            { key: 'recommendation', label: 'Recommendation' },
          ].map((section) => (
            <button
              key={section.key}
              type="button"
              onClick={() => setWorkspaceSection(section.key as typeof workspaceSection)}
              className={cn(
                'h-8 shrink-0 rounded px-3 text-xs font-medium',
                workspaceSection === section.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {status.nextAction}
        </p>
      </div>

      <div className={workspaceSection === 'criteria' ? 'space-y-5' : 'hidden'}>
      {/* Coverage matrix */}
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Assessment matrix</h2>
          <p className="text-2xs text-muted-foreground mt-0.5">
            Evidence across the 9 areas and 8 methods. Only confirmed evidence counts in the summary. Grey entries come from the profile and are leads to follow up; a filled box doesn’t mean there’s enough evidence.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-2xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-2 font-semibold text-muted-foreground/60 uppercase tracking-widest text-[9px]">Criterion</th>
                {EVIDENCE_METHODS.map((m) => (
                  <th key={m.key} className="px-1.5 py-2 font-semibold text-muted-foreground/60 uppercase tracking-widest text-[9px]">
                    {m.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSESSMENT_CRITERIA.map((criterion) => {
                const rowAssessment = assessmentByCriterion.get(criterion.key)
                return (
                  <tr
                    key={criterion.key}
                    onClick={() => setSelected(criterion.key)}
                    className={cn(
                      'border-b border-border/30 cursor-pointer transition-colors',
                      selected === criterion.key ? 'bg-primary/5' : 'hover:bg-surface/60'
                    )}
                  >
                    <td className="px-4 py-2">
                      <span className={cn('font-medium', selected === criterion.key ? 'text-primary' : 'text-foreground')}>
                        {criterion.num}. {criterion.label}
                      </span>
                      {rowAssessment?.score !== null && rowAssessment?.score !== undefined && (
                        <span className="ml-2 tabular-nums text-muted-foreground">{rowAssessment.score}</span>
                      )}
                      {status.illustrativeCriteria.includes(criterion.key) && <span className="ml-2 text-amber-500">Illustrative assessment</span>}
                    </td>
                    {EVIDENCE_METHODS.map((m) => {
                      const cell = cellCounts.get(`${criterion.key}:${m.key}`)
                      const total = (cell?.manual ?? 0) + (cell?.auto ?? 0)
                      return (
                        <td key={m.key} className="px-1.5 py-2 text-center">
                          {total === 0 ? (
                            <span className="inline-block w-5 h-5 rounded bg-surface/80 border border-border/40" />
                          ) : (
                            <span
                              className={cn(
                                'inline-flex items-center justify-center w-5 h-5 rounded font-semibold tabular-nums',
                                cell && cell.verified > 0
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : cell && cell.manual > 0
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                                    : 'bg-muted/40 text-muted-foreground border border-border/60'
                              )}
                            >
                              {total}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {deepDive && <AreaDeepDive area={selected} d={deepDive} />}

      {/* Selected criterion detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-surface rounded-lg p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {selectedMeta.num}. {selectedMeta.label}
            </h3>
            <p className="text-2xs text-muted-foreground mt-0.5">{selectedMeta.question}</p>
            <p className="text-2xs text-muted-foreground mt-1"><span className="font-medium text-foreground">{dimensionFor(selected).label}</span> — {dimensionFor(selected).question}</p>
            {(() => {
              const contributed = new Set(EVIDENCE_METHODS.filter(method => (cellCounts.get(`${selected}:${method.key}`)?.verified ?? 0) > 0).map(method => method.key))
              const coverage = methodCoverage(selected, contributed)
              return <p className="text-2xs mt-1"><span className="text-emerald-300">Checked evidence from: {coverage.contributed.length ? coverage.contributed.join(', ') : 'nothing yet'}</span>{coverage.outstanding.length > 0 && <span className="text-amber-300"> · Still to do: {coverage.outstanding.join(', ')}</span>}</p>
            })()}
            {status.illustrativeCriteria.includes(selected) && <p className="mt-2 text-xs text-amber-500">Not counted in the totals or reports.</p>}
          </div>
          <form onSubmit={submit(saveAssessmentAction)} className="space-y-3">
            <input type="hidden" name="mandate_id" value={mandateId} />
            <input type="hidden" name="coach_id" value={coachId} />
            <input type="hidden" name="criterion" value={selected} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Status</label>
                <select name="status" defaultValue={selectedAssessment?.status ?? 'not_started'} className={inputClass} key={`status-${selected}`}>
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Score (0–100)</label>
                <input
                  key={`score-${selected}`}
                  type="number"
                  name="score"
                  min={0}
                  max={100}
                  defaultValue={selectedAssessment?.score ?? ''}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Conclusive findings</label>
              <textarea
                key={`summary-${selected}`}
                name="summary"
                rows={4}
                defaultValue={selectedAssessment?.summary ?? ''}
                placeholder={`Summary of ${coachName}'s ${selectedMeta.label.toLowerCase()} assessment…`}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Save assessment
            </button>
          </form>

          {/* GBE breakdown shown within Coach Profile criterion */}
          {selected === 'coach_profile' && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1.5">
                Work-permit note (GBE, indicative)
              </p>
              <p className="text-2xs text-muted-foreground">
                Band 1: {gbe.monthsBand1}m · Band 1–2: {gbe.monthsBand1to2}m · Band 1–5: {gbe.monthsBand1to5}m (last 5 years)
              </p>
              {gbe.notes.map((note, i) => (
                <p key={i} className="text-2xs text-amber-300/80 mt-1">{note}</p>
              ))}
            </div>
          )}
        </div>

        <div className="card-surface rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Evidence — {selectedMeta.label}</h3>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {selectedEvidence.length === 0 && selectedDerived.length === 0 && (
              <p className="text-2xs text-muted-foreground">No evidence captured for this criterion yet.</p>
            )}
            {selectedEvidence.map((item) => {
              const isHighlighted = item.id === highlightedEvidenceId
              return (
              <div
                key={item.id}
                id={`evidence-${item.id}`}
                ref={isHighlighted ? highlightedEvidenceRef : undefined}
                className={cn(
                  'border border-border/50 rounded-md px-3 py-2',
                  isHighlighted && 'border-primary/60 bg-primary/10 ring-1 ring-primary/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                      {methodLabel(item.method)}
                      {item.confidence !== null && ` · confidence ${item.confidence}`}
                      {item.source && ` · ${item.source}`}
                      {!item.used_in_recommendation && (
                        <span className="ml-1.5 text-amber-300/80">· excluded from recommendation</span>
                      )}
                    </p>
                    {item.detail && <p className="text-2xs text-muted-foreground mt-1">{item.detail}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <form onSubmit={submit(setEvidenceRecommendationUseAction)}>
                      <input type="hidden" name="evidence_id" value={item.id} />
                      <input type="hidden" name="mandate_id" value={mandateId} />
                      <input type="hidden" name="coach_id" value={coachId} />
                      <select
                        name="used_in_recommendation"
                        defaultValue={item.used_in_recommendation ? 'true' : 'false'}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        title="Whether this evidence feeds the final recommendation"
                        className={cn(
                          'text-2xs bg-surface border border-border rounded px-1.5 py-1',
                          item.used_in_recommendation ? 'text-foreground' : 'text-amber-300'
                        )}
                      >
                        <option value="true">Counts</option>
                        <option value="false">Background</option>
                      </select>
                    </form>
                    <form onSubmit={submit(setEvidenceVerificationAction)}>
                      <input type="hidden" name="evidence_id" value={item.id} />
                      <input type="hidden" name="mandate_id" value={mandateId} />
                      <input type="hidden" name="coach_id" value={coachId} />
                      <select
                        name="verification_status"
                        defaultValue={isIllustrativeEvidence(item) ? 'unverified' : item.verification_status}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className={cn(
                          'text-2xs bg-surface border border-border rounded px-1.5 py-1',
                          isVerifiedEvidence(item) && 'text-emerald-300',
                          item.verification_status === 'disputed' && 'text-red-300'
                        )}
                      >
                        <option value="unverified">Unverified</option>
                        <option value="verified" disabled={isIllustrativeEvidence(item)}>Verified</option>
                        <option value="disputed">Disputed</option>
                      </select>
                    </form>
                    <form onSubmit={submit(deleteEvidenceAction)}>
                      <input type="hidden" name="evidence_id" value={item.id} />
                      <input type="hidden" name="mandate_id" value={mandateId} />
                      <input type="hidden" name="coach_id" value={coachId} />
                      <button type="submit" className="text-2xs text-muted-foreground hover:text-red-400 px-1" title="Delete evidence">
                        ✕
                      </button>
                    </form>
                  </div>
                </div>
              </div>
              )
            })}
            {selectedDerived.map((item, i) => (
              <div key={`derived-${i}`} className="border border-dashed border-border/40 rounded-md px-3 py-2 bg-surface/40">
                <p className="text-xs text-foreground/80">{item.title}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">
                  Auto-derived · {methodLabel(item.method)}
                  {item.detail && ` · ${item.detail}`}
                </p>
              </div>
            ))}
          </div>

          <form onSubmit={submit(addEvidenceAction)} className="border-t border-border/50 pt-3 space-y-2">
            <input type="hidden" name="mandate_id" value={mandateId} />
            <input type="hidden" name="coach_id" value={coachId} />
            <input type="hidden" name="criterion" value={selected} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
              <input name="title" required placeholder="Add evidence — what did you learn?" className={inputClass} key={`ev-title-${selected}`} />
              <select name="method" className={inputClass} defaultValue="desktop_research">
                {EVIDENCE_METHODS.filter((method) =>
                  (DIRECT_ASSESSMENT_EVIDENCE_METHOD_KEYS as readonly string[]).includes(method.key)
                ).map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_90px]">
              <input name="source" placeholder="Publication, dataset or observed material" className={inputClass} key={`ev-source-${selected}`} />
              <input name="detail" placeholder="Detail (optional)" className={inputClass} key={`ev-detail-${selected}`} />
              <input name="confidence" type="number" min={0} max={100} placeholder="Conf." className={inputClass} key={`ev-conf-${selected}`} />
            </div>
            <select name="used_in_recommendation" defaultValue="true" className={inputClass}>
              <option value="true">Counts toward recommendation</option>
              <option value="false">Background only — exclude from recommendation</option>
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="px-3 py-1.5 bg-surface border border-border text-xs font-medium text-foreground rounded-md hover:border-primary/40 transition-colors disabled:opacity-50"
            >
              Add evidence
            </button>
            <p className="text-2xs leading-5 text-muted-foreground">
              Human-source information follows the governed path:
              {' '}
              <Link href={`/intelligence/conversations?coach=${coachId}`} className="font-medium text-primary hover:underline">
                log conversation
              </Link>
              {' → '}review the finding{' → '}use it in this assessment. Candidate interviews and formal references have dedicated sections.
            </p>
          </form>
        </div>
      </div>
      </div>

      {/* Structured human evidence */}
      <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-5', workspaceSection !== 'human' && 'hidden')}>
        <ProcessOverview briefContext={briefContext} interviewAnswers={interviewAnswers} referenceAnswers={referenceAnswers} verdict={recommendation?.verdict ?? null} />
        <StructuredInterviewPanel
          mandateId={mandateId}
          coachId={coachId}
          answers={interviewAnswers}
          submit={submit}
          isPending={isPending}
          highlightedId={highlightedInterviewId}
          briefContext={briefContext}
        />
        <StructuredReferencesPanel
          mandateId={mandateId}
          coachId={coachId}
          answers={referenceAnswers}
          submit={submit}
          isPending={isPending}
          highlightedId={highlightedReferenceId}
        />
      </div>

      {workspaceSection === 'materials' && (
        <ConfidentialDataRoomPanel
          mandateId={mandateId}
          coachId={coachId}
          materials={privateMaterials}
          accessRequests={accessRequests}
          submit={submit}
          isPending={isPending}
        />
      )}

      {/* Final recommendation */}
      <div className={cn('card-surface rounded-lg p-5', workspaceSection !== 'recommendation' && 'hidden')}>
        {finalEvaluation && <div className="mb-6"><h3 className="mb-3 text-sm font-semibold text-foreground">Final evaluation</h3><FinalEvaluationSection e={finalEvaluation} verdict={recommendation?.verdict ?? null} confidence={recommendation?.confidence ?? null} /></div>}
        <h3 className="text-sm font-semibold text-foreground">Human recommendation</h3>
        <p className="mt-2 text-xs text-muted-foreground">{status.recommendationLabel}. Saving a recommendation does not approve the evidence or authorize sharing.</p>
        <p className="text-2xs text-muted-foreground mt-0.5 mb-3">
          The analyst’s conclusion across the nine areas, backed by the evidence above. The board report is built around this.
        </p>
        <form onSubmit={submit(saveRecommendationAction)} className="space-y-3">
          <input type="hidden" name="mandate_id" value={mandateId} />
          <input type="hidden" name="coach_id" value={coachId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_120px_1fr]">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Verdict</label>
              <select name="verdict" defaultValue={recommendation?.verdict ?? ''} className={inputClass}>
                <option value="">— Not decided —</option>
                {RECOMMENDATION_VERDICTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Confidence</label>
              <input name="confidence" type="number" min={0} max={100} defaultValue={recommendation?.confidence ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Summary</label>
              <input name="summary" defaultValue={recommendation?.summary ?? ''} placeholder="Why this coach for this club over the alternatives? State the evidence and the uncertainty that could reverse the recommendation." className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Key strengths</label>
              <textarea name="key_strengths" rows={2} defaultValue={recommendation?.key_strengths ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Key risks</label>
              <textarea name="key_risks" placeholder="The case against, conflicting evidence and what we still don’t know" rows={3} defaultValue={recommendation?.key_risks ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">Mitigation</label>
              <textarea name="mitigation" placeholder="What he needs to succeed, checks before appointing, who owns it and when we review" rows={3} defaultValue={recommendation?.mitigation ?? ''} className={inputClass} />
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Save recommendation
          </button>
        </form>
      </div>
    </div>
  )
}
