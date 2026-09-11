'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VERIFIED_EXAMPLES } from '@/lib/demo/verified-examples'
import type { InvestorDraft } from '@/lib/investor/workspace'
import { saveInvestorWorkspace } from './actions'
import { INVESTOR_STEPS, investorStep, investorStepHref } from '@/lib/investor/step-navigation'
import { passwordUpdateHref, portalLoginHref } from '@/lib/organizations/portal-entry'

export function InvestorWorkspace({ initial, expiresAt }: { initial: InvestorDraft; expiresAt: string }) {
  const [draft, setDraft] = useState(initial)
  const [status, setStatus] = useState('Practice case loaded. Save any changes before leaving this page.')
  const [pendingAction, setPendingAction] = useState<'save' | 'signout' | null>(null)
  const busy = pendingAction !== null
  const [dirty, setDirty] = useState(false)
  const searchParams = useSearchParams()
  const step = investorStep(searchParams.get('step'))
  const resumePath = `/investor?${searchParams.toString()}`
  function setStep(nextStep: number) {
    const next = investorStepHref(window.location.href, nextStep)
    if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
    // Native history keeps the in-memory draft mounted and integrates with Next's search params.
    window.history.pushState(null, '', next)
  }
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function change(next: InvestorDraft) { setDraft(next); setDirty(true); setStatus('Unsaved changes. Save before refreshing or leaving.') }
  async function save() {
    if (busy) return
    setPendingAction('save')
    try {
      const result = await saveInvestorWorkspace(draft)
      if (result.error) setStatus(result.error)
      else { setDirty(false); setStatus('Saved to your account. You can refresh and continue.') }
    } catch { setStatus('Save not confirmed. Your draft remains here; reconnect and retry.') }
    finally { setPendingAction(null) }
  }
  async function signOut() {
    if (busy) return
    if (dirty && !window.confirm('You have unsaved changes. Sign out without saving?')) return
    setPendingAction('signout')
    try {
      const { error } = await createClient().auth.signOut()
      if (error) { setStatus('Sign-out failed. Please retry.'); return }
      window.location.assign(portalLoginHref('investor', `${window.location.pathname}${window.location.search}${window.location.hash}`))
    } catch { setStatus('Sign-out failed. Check your connection and retry.') }
    finally { setPendingAction(null) }
  }
  const steps = INVESTOR_STEPS
  const selected = VERIFIED_EXAMPLES.filter(example => draft.shortlist.includes(example.coachId))
  return <main id="investor-workspace" className="min-h-screen bg-background text-foreground">
    <header className="border-b bg-card px-6 py-5 print:hidden"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
      <p className="font-semibold">Gaffa <span className="ml-2 text-sm font-normal text-muted-foreground">Investor evaluation</span></p>
      <div className="flex gap-5 text-sm"><Link href={passwordUpdateHref('investor', resumePath)} onClick={event => { if (busy || (dirty && !window.confirm('You have unsaved changes. Leave to change your password without saving?'))) event.preventDefault() }} className="underline">Change password</Link><button disabled={busy} onClick={signOut} className="underline disabled:opacity-50">{pendingAction === 'signout' ? 'Signing out...' : 'Sign out'}</button></div>
    </div></header>
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="rounded border border-amber-600/30 bg-amber-500/10 p-4 text-sm">Practice workspace, not a live appointment. Public facts are dated snapshots; coaches are not applicants or endorsers. No private client data, uploads, purchases or external releases. Access ends {new Date(expiresAt).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}.</p>
      <nav aria-label="Evaluation steps" className="my-6 flex flex-wrap gap-2 print:hidden">{steps.map((label, index) => <button key={label} onClick={() => setStep(index)} aria-current={step === index ? 'step' : undefined} className={`rounded border px-4 py-2 text-sm ${step === index ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>{index + 1}. {label}</button>)}</nav>
      <div className="rounded-lg border bg-card p-6 sm:p-9">
        {step === 0 && <section className="max-w-3xl space-y-5">
          <p className="text-xs uppercase tracking-widest text-primary">A 30-minute exploration</p><h1 className="font-serif text-4xl">From a club question to a defensible decision.</h1>
          <p>This restricted area lets you try the core decision process without entering the internal database. Your practice notes belong to this login and cannot be seen by other evaluation accounts.</p>
          <ol className="list-decimal space-y-3 pl-6"><li>Spend 5 minutes editing the club brief. What would success look like?</li><li>Spend 8 minutes checking the four public examples and their sources.</li><li>Spend 7 minutes choosing comparison cases and noting missing evidence.</li><li>Spend 5 minutes reviewing and printing your practice board summary.</li><li>Save, refresh and sign back in. Note what would help you use this in a real appointment.</li></ol>
          <h2 className="font-serif text-2xl">How the real service is handed over</h2><p>The club supplies the brief. An analyst clarifies it, investigates candidates and records evidence. Coaches submit their own material privately. A human reviews the evidence and approves any release. This evaluation does not impersonate those people or mark their evidence verified.</p>
          <button onClick={() => setStep(1)} className="rounded bg-primary px-5 py-3 text-primary-foreground">Begin with the brief</button>
        </section>}
        {step === 1 && <section className="space-y-4"><h1 className="font-serif text-3xl">Define the club question</h1><p className="text-sm text-muted-foreground">Training only. Do not enter confidential club, coach or contact information. Describe priorities, constraints and evidence you would need.</p><label className="block">Practice brief<textarea disabled={busy} maxLength={5000} value={draft.brief} onChange={event => change({ ...draft, brief: event.target.value })} className="mt-3 min-h-64 w-full rounded border bg-background p-4" /></label></section>}
        {step === 2 && <section className="space-y-6"><h1 className="font-serif text-3xl">Four public learning cases</h1><p>No automatic suitability scores. These cases span different divisions; they are not a realistic shared vacancy shortlist.</p><div className="grid gap-5 md:grid-cols-2">{VERIFIED_EXAMPLES.map(example => <article key={example.coachId} className="rounded border p-5"><p className="text-xs uppercase text-primary">{example.league} / checked {example.reviewedOn}</p><h2 className="mt-2 font-serif text-2xl">{example.coachName}</h2><p>{example.clubName}</p><p className="my-4 text-sm text-muted-foreground">{example.use}</p><ul className="space-y-4">{example.facts.map(fact => <li key={fact.text} className="text-sm">{fact.text}<a href={fact.url} target="_blank" rel="noopener noreferrer" className="mt-1 block underline">{fact.sourceTitle} ({fact.asOf})</a></li>)}</ul><p className="mt-4 text-xs text-muted-foreground">Contract, availability, interest and references: not verified.</p></article>)}</div></section>}
        {step === 3 && <section className="space-y-5"><h1 className="font-serif text-3xl">Practice comparison shortlist</h1><p>Select learning cases, not candidates for an actual vacancy. An unchecked box removes only your practice selection.</p><div className="grid gap-3 sm:grid-cols-2">{VERIFIED_EXAMPLES.map(example => <label key={example.coachId} className="flex items-center gap-3 rounded border p-4"><input type="checkbox" disabled={busy} checked={draft.shortlist.includes(example.coachId)} onChange={event => change({ ...draft, shortlist: event.target.checked ? [...draft.shortlist, example.coachId] : draft.shortlist.filter(id => id !== example.coachId) })} />{example.coachName} / {example.clubName}</label>)}</div><label className="block">Questions, evidence gaps and your rationale<textarea disabled={busy} maxLength={10000} value={draft.notes} onChange={event => change({ ...draft, notes: event.target.value })} className="mt-3 min-h-52 w-full rounded border bg-background p-4" /></label><p className="text-sm text-muted-foreground">For example: What would you ask about adapting to a different squad? Who could verify the answer? Nothing entered here is treated as verified evidence.</p></section>}
        {step === 4 && <section className="space-y-6"><h1 className="font-serif text-3xl">Practice board summary</h1><p className="font-medium text-amber-800 dark:text-amber-300">TRAINING ONLY / No appointment recommendation / No release approved</p><h2 className="font-semibold">Club question</h2><p className="whitespace-pre-wrap break-words">{draft.brief || 'No brief recorded.'}</p><h2 className="font-semibold">Public comparison cases</h2><ul className="list-disc pl-5">{selected.map(example => <li key={example.coachId}>{example.coachName} / {example.clubName} / snapshot checked {example.reviewedOn}</li>)}</ul>{!selected.length && <p>No cases selected.</p>}<h2 className="font-semibold">Unverified evaluator notes</h2><p className="whitespace-pre-wrap break-words">{draft.notes || 'No notes recorded.'}</p><h2 className="font-semibold">Before a real decision</h2><p>Obtain permission, verify availability and references, assess club-specific fit, assign a human reviewer and approve each recipient. No real coach material is released by this page.</p><button onClick={() => window.print()} className="rounded border px-4 py-2 print:hidden">Print practice summary</button><p className="text-xs text-muted-foreground">This summary reflects the current on-screen draft, including any unsaved changes. Source details appear in Public examples.</p></section>}
      </div>
      <nav aria-label="Previous and next evaluation step" className="mt-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded border px-4 py-2 text-sm disabled:opacity-50">Previous{step > 0 ? `: ${steps[step - 1]}` : ''}</button>
        <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}. {dirty ? 'Draft changes are not saved yet.' : 'Save any new changes before leaving.'}</p>
        <button disabled={step === steps.length - 1} onClick={() => setStep(step + 1)} className="rounded border px-4 py-2 text-sm disabled:opacity-50">Next{step < steps.length - 1 ? `: ${steps[step + 1]}` : ''}</button>
      </nav>
      <div className="mt-5 flex flex-wrap items-center gap-4 print:hidden"><button disabled={busy} onClick={save} className="rounded bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">{pendingAction === 'save' ? 'Saving...' : 'Save my practice workspace'}</button><p role="status" aria-live="polite" className="max-w-xl text-sm">{status}</p></div>
    </div>
  </main>
}
