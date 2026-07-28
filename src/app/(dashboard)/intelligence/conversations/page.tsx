import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { formatEnumLabel } from '@/lib/intelligence/display'
import { ConversationCaptureClient } from '../_components/conversation-capture-client'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function ConversationsPage(props: { searchParams?: Promise<{ coach?: string; contact?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  const db = supabase as any
  const [{ data: sessions }, { data: contacts }, { data: coaches }, { data: claims }] = await Promise.all([
    db.from('intelligence_sessions').select('*').eq('org_id', organizationId).order('occurred_at', { ascending: false }).limit(200),
    db.from('football_contacts').select('id, full_name').eq('org_id', organizationId).order('full_name'),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
    db.from('profile_claims').select('session_id, review_status').eq('org_id', organizationId).not('session_id', 'is', null),
  ])
  const contactMap = new Map((contacts ?? []).map((row: { id: string; full_name: string }) => [row.id, row.full_name]))
  const coachMap = new Map((coaches ?? []).map((row) => [row.id, row.name]))
  const claimCounts = new Map<string, { total: number; accepted: number }>()
  for (const claim of claims ?? []) {
    const current = claimCounts.get(claim.session_id) ?? { total: 0, accepted: 0 }
    current.total += 1
    if (['accepted', 'applied'].includes(claim.review_status)) current.accepted += 1
    claimCounts.set(claim.session_id, current)
  }
  const selectedCoachId = (coaches ?? []).some((coach) => coach.id === searchParams?.coach) ? searchParams?.coach : undefined
  const selectedContactId = (contacts ?? []).some((contact: { id: string }) => contact.id === searchParams?.contact) ? searchParams?.contact : undefined
  return (
    <div className="space-y-4">
      <ConversationCaptureClient
        organizationId={organizationId}
        contacts={contacts ?? []}
        coaches={coaches ?? []}
        defaultCoachId={selectedCoachId}
        defaultContactId={selectedContactId}
      />

      <div className="space-y-2 md:hidden">
        {(sessions ?? []).map((session: Record<string, any>) => {
          const counts = claimCounts.get(session.id) ?? { total: 0, accepted: 0 }
          return (
            <article key={session.id} className="border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/intelligence/review?session=${session.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {String(session.title)}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(session.occurred_at).toLocaleString('en-GB')} ·{' '}
                    {formatEnumLabel(String(session.intake_method))}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatEnumLabel(String(session.processing_status))}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="mt-0.5">
                    {String(contactMap.get(session.contact_id) || 'Not linked')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Coach</dt>
                  <dd className="mt-0.5">
                    {session.coach_id ? (
                      <Link
                        href={`/coaches/${session.coach_id}/intelligence`}
                        className="hover:text-primary"
                      >
                        {String(coachMap.get(session.coach_id) || 'Coach')}
                      </Link>
                    ) : (
                      'General'
                    )}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/intelligence/review?session=${session.id}`}
                className="mt-4 inline-flex text-xs font-medium text-primary"
              >
                Review findings · {counts.accepted}/{counts.total} reviewed
              </Link>
            </article>
          )
        })}
        {!(sessions ?? []).length && (
          <div className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No conversations captured yet. Log the first source conversation above.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto border border-border bg-card md:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Conversation</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Coach</th>
              <th className="px-4 py-3 font-medium">Findings</th>
              <th className="px-4 py-3 font-medium">State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(sessions ?? []).map((session: Record<string, any>) => {
              const counts = claimCounts.get(session.id) ?? { total: 0, accepted: 0 }
              return (
                <tr key={session.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/intelligence/review?session=${session.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {String(session.title)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.occurred_at).toLocaleString('en-GB')} ·{' '}
                      {formatEnumLabel(String(session.intake_method))}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {String(contactMap.get(session.contact_id) || 'Analyst source not linked')}
                  </td>
                  <td className="px-4 py-3">
                    {session.coach_id ? (
                      <Link
                        href={`/coaches/${session.coach_id}/intelligence`}
                        className="hover:text-primary"
                      >
                        {String(coachMap.get(session.coach_id) || 'Coach')}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">General</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {counts.accepted}/{counts.total} reviewed
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatEnumLabel(String(session.processing_status))}
                  </td>
                </tr>
              )
            })}
            {!(sessions ?? []).length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No conversations captured yet. Log the first source conversation above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
