'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, LoaderCircle, UserPlus } from 'lucide-react'
import { issueCoachInvitationAction } from '../../actions'

export function InviteCoachUserForm({ coachId }: { coachId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function submit(formData: FormData) {
    setError(null)
    setInviteLink(null)
    startTransition(async () => {
      const result = await issueCoachInvitationAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Coach invitation could not be created.')
        return
      }
      setInviteLink(result.inviteLink ?? null)
    })
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div>
      <form action={submit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
        <input type="hidden" name="coach_id" value={coachId} />
        <input
          name="email"
          type="email"
          required
          placeholder="coach or representative email"
          className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground"
        />
        <select name="role" className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground">
          <option value="coach">Coach</option>
          <option value="coach_representative">Coach representative</option>
        </select>
        <button disabled={pending} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create invite
        </button>
      </form>
      {error && <p className="mt-3 rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-xs text-red-900">{error}</p>}
      {inviteLink && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-700/20 bg-emerald-50 p-2">
          <input readOnly value={inviteLink} className="min-w-0 flex-1 bg-transparent px-2 text-xs text-emerald-950 outline-none" />
          <button type="button" onClick={copyLink} title="Copy invitation link" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-900/15 bg-white text-emerald-950">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
        Links expire after seven days and can be claimed only by the invited email. Create a fresh link to supersede an earlier pending invitation.
      </p>
    </div>
  )
}
