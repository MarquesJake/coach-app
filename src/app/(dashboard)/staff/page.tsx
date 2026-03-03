import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { PageState } from '@/components/ui/page-state'

export default async function StaffPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, primary_role, specialties, notes, created_at')
    .eq('user_id', user.id)
    .order('full_name')

  if (staff === null) return <PageState state="error" message="Failed to load staff" minHeight="sm" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/staff/new"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add staff
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <EmptyState
            title="No data available."
            description="Add staff to build your network and link them to coaches."
            actionLabel="Add staff"
            actionHref="/staff/new"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_80px] px-5 py-2.5 border-b border-border bg-surface/50">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Name</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Role</span>
            <span />
          </div>
          <div className="divide-y divide-border/50">
            {staff.map((s) => (
              <Link
                key={s.id}
                href={`/staff/${s.id}`}
                className="grid grid-cols-[1fr_140px_80px] px-5 py-3 items-center hover:bg-surface-overlay/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">{s.full_name}</span>
                <span className="text-2xs text-muted-foreground">{s.primary_role ?? '—'}</span>
                <span className="text-2xs text-primary">View</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
