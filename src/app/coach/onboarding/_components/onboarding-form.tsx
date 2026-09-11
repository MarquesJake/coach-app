'use client'

import { useRef, useState, useTransition } from 'react'
import { unstable_rethrow } from 'next/navigation'
import type { ExternalOnboardingState } from '@/components/organizations/external-onboarding-form'

export function CoachOnboardingForm({ action, organizationName, defaultTitle }: {
  action: (state: ExternalOnboardingState, data: FormData) => Promise<ExternalOnboardingState>
  organizationName: string
  defaultTitle: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  return <form className="space-y-5" aria-busy={pending} onSubmit={event => {
    event.preventDefault()
    if (submitting.current) return
    const data = new FormData(event.currentTarget)
    submitting.current = true
    setError(null)
    startTransition(async () => {
      try { setError((await action({}, data)).error ?? null) }
      catch (cause) { unstable_rethrow(cause); setError('Account setup was not confirmed. Your entries are retained; reconnect and retry.') }
      finally { submitting.current = false }
    })
  }}>
    <fieldset disabled={pending} className="min-w-0 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">Full name<input name="display_name" autoComplete="name" required minLength={2} maxLength={100} className="mt-1 min-h-11 w-full rounded border border-slate-300 px-3" /></label>
        <label className="block text-sm">Role or relationship<input name="position_title" required minLength={2} maxLength={120} defaultValue={defaultTitle} className="mt-1 min-h-11 w-full rounded border border-slate-300 px-3" /></label>
      </div>
      <label className="block text-sm">Contact number (optional)<input name="contact_phone" type="tel" autoComplete="tel" maxLength={50} className="mt-1 min-h-11 w-full rounded border border-slate-300 px-3" /></label>
      <div className="space-y-4 rounded border border-emerald-900/15 bg-emerald-50 p-4">
        <h3 className="text-sm font-semibold">Private-access acknowledgements</h3>
        <label className="flex items-start gap-3 text-xs leading-5"><input name="accepted_confidentiality" type="checkbox" required className="mt-1 shrink-0" /><span>I will treat information made available through {organizationName} as confidential and will not forward access or download material for unrelated use.</span></label>
        <label className="flex items-start gap-3 text-xs leading-5"><input name="accepted_intended_use" type="checkbox" required className="mt-1 shrink-0" /><span>I understand this account is for maintaining coach-owned information and submitting work for Gaffa review.</span></label>
      </div>
    </fieldset>
    {error && <p role="alert" className="rounded border border-red-700/20 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
    <button disabled={pending} className="min-h-11 w-full rounded bg-emerald-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Securing account...' : 'Open my coach profile'}</button>
  </form>
}
