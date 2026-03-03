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
    .select('id, coach_id, club_name, role_title, started_on, ended_on, times_worked_together, impact_summary')
    .eq('staff_id', id)
    .order('ended_on', { ascending: false, nullsFirst: true })

  const coachIds = Array.from(new Set((history ?? []).map((h) => h.coach_id)))
  const { data: coaches } = coachIds.length
    ? await supabase.from('coaches').select('id, name').in('id', coachIds)
    : { data: [] }
  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c.name]))

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
            {staff.notes && (
              <div>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="text-muted-foreground whitespace-pre-wrap">{staff.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="card-surface rounded-lg p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Work history with coaches</h2>
          {!history?.length ? (
            <p className="text-sm text-muted-foreground">No coach links yet. Link this staff from a coach’s Staff network tab.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <Link href={`/coaches/${h.coach_id}`} className="text-sm font-medium text-primary hover:underline">
                      {coachMap.get(h.coach_id) ?? h.coach_id}
                    </Link>
                    <span className="text-2xs text-muted-foreground ml-2">{h.club_name} · {h.role_title}</span>
                  </div>
                  <span className="text-2xs text-muted-foreground">
                    {h.started_on ?? '?'} – {h.ended_on ?? 'present'} · {h.times_worked_together}x
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
