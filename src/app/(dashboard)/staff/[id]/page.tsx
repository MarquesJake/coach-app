import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getStaffById } from '@/lib/db/staff'

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = params
  const { data: staff } = await getStaffById(user.id, id)
  if (!staff) notFound()

  const { data: history } = await supabase
    .from('coach_staff_history')
    .select('id, coach_id, club_name, role_title, started_on, ended_on, times_worked_together, followed_from_previous, relationship_strength, confidence, verified')
    .eq('staff_id', id)
    .order('ended_on', { ascending: false, nullsFirst: true })
    .order('started_on', { ascending: false })

  const coachIds = Array.from(new Set((history ?? []).map((h) => h.coach_id)))
  const { data: coaches } = coachIds.length
    ? await supabase.from('coaches').select('id, name').in('id', coachIds).eq('user_id', user.id)
    : { data: [] }
  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c.name]))

  const totalCoaches = coachIds.length
  const repeatCollaborations = (history ?? []).filter((h) => (h.times_worked_together ?? 0) > 1).length
  const strengthValues = (history ?? []).map((h) => h.relationship_strength).filter((v): v is number => v != null)
  const avgStrength = strengthValues.length ? Math.round(strengthValues.reduce((a, b) => a + b, 0) / strengthValues.length) : null
  const currentClubInvolvement = (history ?? []).filter((h) => h.ended_on == null).length

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <Link href="/staff" className="text-xs text-muted-foreground hover:text-foreground">← Staff</Link>
        <h1 className="text-lg font-semibold text-foreground mt-1">{staff.full_name}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {staff.primary_role ?? 'No role set'}
        </p>
      </div>

      <div className="space-y-6">
        <div className="card-surface rounded-lg p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Overview</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Primary role</dt>
              <dd className="font-medium">{staff.primary_role ?? '—'}</dd>
            </div>
            {Array.isArray(staff.specialties) && staff.specialties.length > 0 && (
              <div>
                <dt className="text-muted-foreground">Specialties</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {staff.specialties.map((sp) => (
                    <span key={sp} className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                      {sp}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {staff.notes && (
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="text-muted-foreground whitespace-pre-wrap">{staff.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {history && history.length > 0 && (
          <div className="card-surface rounded-lg p-5">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Network summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Linked coaches</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{totalCoaches}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Repeat collaborations</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{repeatCollaborations}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg relationship strength</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{avgStrength != null ? `${avgStrength}%` : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Current club involvement</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{currentClubInvolvement}</p>
              </div>
            </div>
          </div>
        )}

        <div className="card-surface rounded-lg p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Work history with coaches</h2>
          {!history?.length ? (
            <p className="text-sm text-muted-foreground">No coach links yet. Link this staff from a coach’s Staff network tab.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Coach</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Club</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dates</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Followed</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Strength</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conf.</th>
                    <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2">
                        <Link href={`/coaches/${h.coach_id}`} className="font-medium text-primary hover:underline">
                          {coachMap.get(h.coach_id) ?? h.coach_id}
                        </Link>
                      </td>
                      <td className="py-2 text-muted-foreground">{h.club_name}</td>
                      <td className="py-2 text-muted-foreground">{h.role_title}</td>
                      <td className="py-2 text-muted-foreground">
                        {h.started_on ?? '?'} – {h.ended_on ?? 'present'}
                        {(h.times_worked_together ?? 0) > 1 && <span className="ml-1">· {h.times_worked_together}×</span>}
                      </td>
                      <td className="py-2">
                        {h.followed_from_previous ? (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Followed</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 tabular-nums">{h.relationship_strength != null ? `${h.relationship_strength}%` : '—'}</td>
                      <td className="py-2 tabular-nums">{h.confidence != null ? `${h.confidence}%` : '—'}</td>
                      <td className="py-2">{h.verified ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
