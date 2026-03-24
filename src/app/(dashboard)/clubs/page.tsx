import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/empty-state'
import { Plus } from 'lucide-react'

export default async function ClubsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name, league, country, tier, notes')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/clubs/new"
          className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add club
        </Link>
      </div>

      {(clubs?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <EmptyState
            title="No data available."
            description="Add a club to use in mandates and matches."
            actionLabel="Add club"
            actionHref="/clubs/new"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">League</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Country</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</th>
                  <th className="w-20 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {clubs?.map((club) => (
                  <tr key={club.id} className="border-b border-border/50 hover:bg-surface-overlay/30">
                    <td className="px-5 py-3 font-medium text-foreground">
                      <Link href={`/clubs/${club.id}`} className="hover:text-primary transition-colors">
                        {club.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{club.league}</td>
                    <td className="px-5 py-3 text-muted-foreground">{club.country}</td>
                    <td className="px-5 py-3 text-muted-foreground">{club.tier ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/clubs/${club.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
