import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageState } from '@/components/ui/page-state'
import { StaffListFilters } from './_components/staff-list-filters'

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const q = (params.q ?? '').trim().toLowerCase()
  const roleFilter = (params.role ?? '').trim()

  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, primary_role, specialties, notes, created_at')
    .eq('user_id', user.id)
    .order('full_name')

  if (staff === null) return <PageState state="error" message="Failed to load staff" minHeight="sm" />

  let filtered = staff
  if (q) filtered = filtered.filter((s) => s.full_name.toLowerCase().includes(q))
  if (roleFilter) filtered = filtered.filter((s) => (s.primary_role ?? '') === roleFilter)

  const staffIds = filtered.map((s) => s.id)
  const linkStats: Record<string, { count: number; maxStrength: number | null; hasCurrent: boolean; maxEndedOn: string | null }> = {}
  if (staffIds.length > 0) {
    const { data: history } = await supabase
      .from('coach_staff_history')
      .select('staff_id, relationship_strength, ended_on')
      .in('staff_id', staffIds)
    for (const s of staffIds) linkStats[s] = { count: 0, maxStrength: null, hasCurrent: false, maxEndedOn: null }
    for (const h of history ?? []) {
      const cur = linkStats[h.staff_id]
      if (!cur) continue
      cur.count++
      if (h.relationship_strength != null && (cur.maxStrength == null || h.relationship_strength > cur.maxStrength))
        cur.maxStrength = h.relationship_strength
      if (h.ended_on == null) cur.hasCurrent = true
      if (h.ended_on && (cur.maxEndedOn == null || h.ended_on > cur.maxEndedOn)) cur.maxEndedOn = h.ended_on
    }
  }

  const roles = Array.from(new Set(staff.map((s) => s.primary_role).filter(Boolean))) as string[]
  roles.sort((a, b) => (a ?? '').localeCompare(b ?? ''))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StaffListFilters roles={roles} initialQ={params.q} initialRole={params.role} />
        <Link
          href="/staff/new"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add staff
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <EmptyState
            title="No data available."
            description={staff.length === 0 ? 'Add staff to build your network and link them to coaches.' : 'No staff match the current filters.'}
            actionLabel={staff.length === 0 ? 'Add staff' : undefined}
            actionHref={staff.length === 0 ? '/staff/new' : undefined}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Name</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Primary role</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Specialties</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Coaches linked</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Strongest relationship</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">Most recent work</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((s) => {
                  const stats = linkStats[s.id]
                  const mostRecent = stats?.hasCurrent ? 'Current' : (stats?.maxEndedOn ? new Date(stats.maxEndedOn).toLocaleDateString() : '—')
                  return (
                    <tr key={s.id} className="hover:bg-surface-overlay/30">
                      <td className="py-3 px-4">
                        <Link href={`/staff/${s.id}`} className="font-medium text-primary hover:underline">
                          {s.full_name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{s.primary_role ?? '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(s.specialties ?? []).slice(0, 4).map((sp) => (
                            <span key={sp} className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                              {sp}
                            </span>
                          ))}
                          {(!s.specialties || s.specialties.length === 0) && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 tabular-nums">{stats?.count ?? 0}</td>
                      <td className="py-3 px-4 tabular-nums">{stats?.maxStrength != null ? `${stats.maxStrength}%` : '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{mostRecent}</td>
                      <td className="py-3 px-4">
                        <Link href={`/staff/${s.id}`} className="text-2xs text-primary hover:underline">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
