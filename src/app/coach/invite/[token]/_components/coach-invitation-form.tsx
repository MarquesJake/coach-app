'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LoaderCircle, LogOut, ShieldCheck } from 'lucide-react'
import {
  completeCoachInvitationAction,
  signOutFromCoachInvitationAction,
} from '../actions'

export function CoachInvitationForm({
  token,
  hasSession,
  currentEmail,
}: {
  token: string
  hasSession: boolean
  currentEmail: string | null
}) {
  const [mode, setMode] = useState<'sign_up' | 'sign_in'>('sign_up')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)
  const router = useRouter()

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await completeCoachInvitationAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Coach access could not be completed.')
        return
      }
      if (result.checkEmail) {
        setCheckEmail(true)
        return
      }
      router.push('/coach/profile')
      router.refresh()
    })
  }

  function useAnotherAccount() {
    startTransition(async () => {
      await signOutFromCoachInvitationAction()
      router.refresh()
    })
  }

  if (checkEmail) {
    return (
      <div className="rounded-md border border-emerald-700/20 bg-emerald-50 p-4">
        <ShieldCheck className="h-5 w-5 text-emerald-800" />
        <h2 className="mt-3 text-sm font-semibold text-emerald-950">Confirm your email</h2>
        <p className="mt-1 text-xs leading-5 text-emerald-900/80">
          Open the confirmation message on the same device. The secure link will finish
          connecting your account to your coach profile.
        </p>
      </div>
    )
  }

  if (hasSession) {
    return (
      <div>
        <form action={submit}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="mode" value="claim" />
          <p className="text-sm text-slate-800">
            Signed in as <span className="font-semibold">{currentEmail}</span>
          </p>
          <button disabled={pending} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Accept coach access
          </button>
        </form>
        <button type="button" onClick={useAnotherAccount} disabled={pending} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-600">
          <LogOut className="h-4 w-4" />
          Use another account
        </button>
        {error && <p className="mt-3 rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-xs text-red-900">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
        <button type="button" onClick={() => setMode('sign_up')} className={`rounded px-3 py-2 text-xs font-semibold ${mode === 'sign_up' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          Create account
        </button>
        <button type="button" onClick={() => setMode('sign_in')} className={`rounded px-3 py-2 text-xs font-semibold ${mode === 'sign_in' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}>
          Existing account
        </button>
      </div>
      <form action={submit} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="mode" value={mode} />
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Invited email</span>
          <input name="email" type="email" required autoComplete="email" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Password</span>
          <input name="password" type="password" required minLength={10} autoComplete={mode === 'sign_up' ? 'new-password' : 'current-password'} className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" />
          <span className="mt-1.5 block text-[11px] text-slate-500">At least 10 characters.</span>
        </label>
        {error && <p className="rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-xs text-red-900">{error}</p>}
        <button disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {mode === 'sign_up' ? 'Create secure coach account' : 'Sign in and accept'}
        </button>
      </form>
    </div>
  )
}
