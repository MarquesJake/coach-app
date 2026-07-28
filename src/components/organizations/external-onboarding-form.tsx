'use client'

import { useState, useTransition } from 'react'
import { LoaderCircle, ShieldCheck } from 'lucide-react'

export type ExternalOnboardingState = {
  error?: string
}

type ExternalOnboardingFormProps = {
  action: (
    state: ExternalOnboardingState,
    formData: FormData
  ) => Promise<ExternalOnboardingState>
  accountType: 'club' | 'coach'
  organizationName: string
  defaultTitle: string
}

const inputClass =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-800/20'

export function ExternalOnboardingForm({
  action,
  accountType,
  organizationName,
  defaultTitle,
}: ExternalOnboardingFormProps) {
  const [state, setState] = useState<ExternalOnboardingState>({})
  const [pending, startTransition] = useTransition()
  const isClub = accountType === 'club'

  function submit(formData: FormData) {
    setState({})
    startTransition(async () => {
      setState(await action({}, formData))
    })
  }

  return (
    <form action={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</span>
          <input
            name="display_name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            {isClub ? 'Role at the club' : 'Role or relationship'}
          </span>
          <input
            name="position_title"
            required
            minLength={2}
            maxLength={120}
            defaultValue={defaultTitle}
            placeholder={isClub ? 'Sporting Director' : 'Coach representative'}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-slate-700">
          Contact number <span className="font-normal text-slate-500">(optional)</span>
        </span>
        <input
          name="contact_phone"
          type="tel"
          autoComplete="tel"
          maxLength={50}
          className={inputClass}
        />
      </label>

      <div className="space-y-3 rounded-md border border-emerald-900/15 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-emerald-950">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-xs font-semibold">Private-access acknowledgements</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-emerald-950">
          <input
            name="accepted_confidentiality"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-emerald-900/30 text-emerald-900"
          />
          <span>
            I will treat the information made available through {organizationName} as
            confidential and will not forward access or download material for unrelated use.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-emerald-950">
          <input
            name="accepted_intended_use"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 rounded border-emerald-900/30 text-emerald-900"
          />
          <span>
            I understand this account is for {isClub
              ? 'the club appointment process and approved decision material'
              : 'maintaining coach-owned information and submitting work for Coach First review'}.
          </span>
        </label>
      </div>

      {state.error && (
        <p className="rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-900">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-50"
      >
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
        {pending ? 'Securing account' : isClub ? 'Enter the club decision room' : 'Open my coach profile'}
      </button>
    </form>
  )
}
