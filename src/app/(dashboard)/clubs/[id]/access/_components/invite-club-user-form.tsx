'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, LoaderCircle, Send } from 'lucide-react'
import { issueClubInvitationAction } from '../actions'

export function InviteClubUserForm({
  clubId,
  organizationId,
}: {
  clubId: string
  organizationId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function submit(formData: FormData) {
    setError(null)
    setInviteLink(null)
    startTransition(async () => {
      const result = await issueClubInvitationAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Invitation could not be created.')
        return
      }
      setInviteLink(result.inviteLink ?? null)
      router.refresh()
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
      <form action={submit} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
        <input type="hidden" name="club_id" value={clubId} />
        <input type="hidden" name="organization_id" value={organizationId} />
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-foreground">Club email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="director@club.com"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-foreground">Access role</span>
          <select name="role" defaultValue="club_director" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            <option value="club_owner">Club owner</option>
            <option value="club_director">Club director</option>
            <option value="club_viewer">Board viewer</option>
          </select>
        </label>
        <button disabled={pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Create invite
        </button>
      </form>
      {error && <p className="mt-3 rounded-md border border-red-700/20 bg-red-50 px-3 py-2 text-xs text-red-900">{error}</p>}
      {inviteLink && (
        <div className="mt-4 rounded-md border border-emerald-700/20 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-950">Single-use link created</p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={inviteLink} className="h-9 min-w-0 flex-1 rounded-md border border-emerald-900/15 bg-white px-3 text-xs text-emerald-950" />
            <button type="button" onClick={copyLink} title="Copy invitation link" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-emerald-900/15 bg-white text-emerald-950">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-emerald-900/75">Send this link to the intended recipient. It expires in seven days and cannot be recovered after leaving this screen.</p>
        </div>
      )}
    </div>
  )
}
