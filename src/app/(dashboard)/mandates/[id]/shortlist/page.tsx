import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function MandateShortlistPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = params
  const { data: mandate } = await supabase
    .from('mandates')
    .select('id, custom_club_name, club_id, clubs(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!mandate) notFound()

  const { data: shortlist } = await supabase
    .from('mandate_shortlist')
    .select('id, coach_id, status, notes, placement_probability, risk_rating')
    .eq('mandate_id', id)
    .order('placement_probability', { ascending: false })

  const coachIds = Array.from(new Set((shortlist ?? []).map((s) => s.coach_id)))
  const { data: coaches } = coachIds.length ? await supabase.from('coaches').select('id, name, club_current').in('id', coachIds) : { data: [] }
  const coachMap = new Map((coaches ?? []).map((c) => [c.id, c]))

  const clubName = (mandate as { custom_club_name?: string | null; clubs?: { name?: string } | null }).custom_club_name
    ?? (mandate as { clubs?: { name?: string } | null }).clubs?.name
    ?? 'Mandate'

  return (
    <div className="max-w-[1200px] mx-auto">
      <Link href={`/mandates/${id}`} className="text-xs text-muted-foreground hover:text-foreground">← Mandate</Link>
      <h1 className="text-lg font-semibold text-foreground mt-1">Shortlist · {clubName}</h1>
      <p className="text-xs text-muted-foreground mt-0.5">Manage shortlisted coaches: status, notes, next actions.</p>

      <div className="mt-6 card-surface rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_120px_200px] px-5 py-2.5 border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          <span>Coach</span>
          <span>Status</span>
          <span>Probability</span>
          <span>Notes</span>
        </div>
        <div className="divide-y divide-border/50">
          {!shortlist?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No shortlist yet. Add coaches from the mandate Overview or from the Longlist.
            </div>
          ) : (
            shortlist.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_100px_120px_200px] px-5 py-3 items-center gap-2">
                <Link href={`/coaches/${row.coach_id}`} className="text-sm font-medium text-primary hover:underline">
                  {coachMap.get(row.coach_id)?.name ?? row.coach_id}
                </Link>
                <span className="text-2xs">{row.status}</span>
                <span className="tabular-nums text-2xs">{row.placement_probability}%</span>
                <span className="text-2xs text-muted-foreground truncate">{row.notes ?? '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
