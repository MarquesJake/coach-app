import { amendmentChanges, type BriefAmendment } from '@/lib/clubs/brief-amendments'
import { ReliableBriefForm } from './brief-amendment-form'
import { decideBriefAmendmentAction } from '@/app/brief-amendment-actions'

function date(value: string) {
  return new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' }) + ' UK'
}

export function BriefAmendmentHistory({ amendments, canReview = false }: { amendments: BriefAmendment[]; canReview?: boolean }) {
  if (!amendments.length) return <p className="text-sm text-muted-foreground">No amendment requests. The original agreed brief is version 1.</p>
  return <div className="space-y-4">{amendments.map(amendment => <article key={amendment.id} className="min-w-0 space-y-3 rounded border border-border p-4">
    <h3 className="text-sm font-semibold">{amendment.status === 'pending' ? 'Awaiting Gaffa review' : amendment.status === 'accepted' ? `Accepted · agreed version ${amendment.accepted_version}` : 'Declined · agreed wording unchanged'}</h3>
    <p className="text-xs text-muted-foreground">Requested {date(amendment.requested_at)} against version {amendment.base_version}</p>
    <p className="whitespace-pre-wrap break-words text-sm"><strong>Club reason: </strong>{amendment.request_reason}</p>
    <dl className="space-y-3">{amendmentChanges(amendment.before_snapshot, amendment.after_snapshot).map(change => <div key={change.key}>
      <dt className="text-sm font-semibold">{change.label}</dt>
      <dd className="mt-1 grid min-w-0 gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded bg-muted/50 p-3"><p className="text-xs font-semibold">Before · version {amendment.base_version}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{change.before || 'Not supplied'}</p></div>
        <div className="min-w-0 rounded border border-border p-3"><p className="text-xs font-semibold">{amendment.status === 'accepted' ? 'Accepted wording' : 'Proposed wording'}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{change.after || 'Removed / not supplied'}</p></div>
      </dd>
    </div>)}</dl>
    {amendment.reviewed_at && <div className="space-y-2 border-t border-border pt-3 text-sm">
      <p className="text-xs text-muted-foreground">Gaffa decision · {date(amendment.reviewed_at)}</p>
      <p className="whitespace-pre-wrap break-words"><strong>Decision reason: </strong>{amendment.decision_note}</p>
      <p className="whitespace-pre-wrap break-words"><strong>Next action: </strong>{amendment.next_action}</p>
    </div>}
    {canReview && amendment.status === 'pending' && <ReliableBriefForm action={decideBriefAmendmentAction}>
      <input type="hidden" name="brief_id" value={amendment.brief_id} />
      <input type="hidden" name="amendment_id" value={amendment.id} />
      <p className="text-xs text-muted-foreground">The club can see your reason and next step. Accepting creates a new agreed version of the brief — check how it affects the mandate, the candidate comparisons and any reports already prepared.</p>
      <label className="block text-sm font-medium">Decision reason<textarea name="decision_note" required maxLength={4000} rows={3} className="mt-1 block w-full rounded border border-input bg-background p-2 font-normal" /></label>
      <label className="block text-sm font-medium">Next action and responsible person<textarea name="next_action" required maxLength={4000} rows={2} className="mt-1 block w-full rounded border border-input bg-background p-2 font-normal" /></label>
      <div className="flex flex-wrap gap-3">
        <button name="status" value="accepted" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Accept amendment</button>
        <button name="status" value="declined" className="rounded border border-border px-4 py-2 text-sm">Decline amendment</button>
      </div>
    </ReliableBriefForm>}
  </article>)}</div>
}
