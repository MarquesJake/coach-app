import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ChevronRight, Shield } from 'lucide-react'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function truncate(value: string, max = 30) {
  return value.length > max ? `${value.slice(0, max)}...` : value
}

export default async function MandatesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: mandates, error } = await supabase
    .from('mandates')
    .select(`
      id,
      status,
      priority,
      target_completion_date,
      ownership_structure,
      budget_band,
      clubs (
        name,
        league
      ),
      mandate_shortlist (
        id
      )
    `)
    .eq('user_id', user.id)
    .order('target_completion_date', { ascending: true })

  if (error) {
    throw new Error(`Failed to load mandates: ${error.message}`)
  }

  const total = mandates.length
  const active = mandates.filter((m) => m.status === 'Active').length
  const inProgress = mandates.filter((m) => m.status === 'In Progress').length
  const highPriority = mandates.filter((m) => m.priority === 'High').length

  return (
    <div className="max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Active Mandates</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
            Client Engagements &amp; Placement Projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-raised rounded text-[10px] transition-colors border border-border font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
            <Shield className="w-3 h-3" />
            Filter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card-surface rounded p-3">
          <div className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1 font-semibold">Total Mandates</div>
          <div className="text-2xl font-bold text-foreground">{total}</div>
        </div>
        <div className="card-surface rounded p-3">
          <div className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1 font-semibold">Active</div>
          <div className="text-2xl font-bold text-emerald-500">{active}</div>
        </div>
        <div className="card-surface rounded p-3">
          <div className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1 font-semibold">In Progress</div>
          <div className="text-2xl font-bold text-foreground">{inProgress}</div>
        </div>
        <div className="card-surface rounded p-3">
          <div className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1 font-semibold">High Priority</div>
          <div className="text-2xl font-bold text-destructive">{highPriority}</div>
        </div>
      </div>

      {/* Mandates Table */}
      <div className="card-surface rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <h2 className="font-bold text-foreground text-[11px] uppercase tracking-widest">All Engagements</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Club
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  League
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Priority
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Target Date
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Shortlist
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Budget Band
                </th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mandates.map((mandate) => (
                <tr key={mandate.id} className="hover:bg-surface-overlay/20 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold text-foreground text-sm">{mandate.clubs?.name ?? 'Unknown Club'}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        {truncate(mandate.ownership_structure)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted-foreground">{mandate.clubs?.league ?? 'Unknown League'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                        mandate.status === 'Active'
                          ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                          : mandate.status === 'In Progress'
                          ? 'bg-slate-900/40 text-slate-400 border-slate-800/40'
                          : mandate.status === 'Completed'
                          ? 'bg-surface text-muted-foreground border-border'
                          : 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                      }`}
                    >
                      {mandate.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                        mandate.priority === 'High'
                          ? 'bg-red-950/40 text-red-500 border-red-900/40'
                          : mandate.priority === 'Medium'
                          ? 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                          : 'bg-surface text-muted-foreground border-border'
                      }`}
                    >
                      {mandate.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted-foreground">{formatDate(mandate.target_completion_date)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-foreground">{mandate.mandate_shortlist.length} candidates</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted-foreground">{truncate(mandate.budget_band, 20)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/mandates/${mandate.id}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[10px] font-bold transition-colors uppercase tracking-widest"
                    >
                      View
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
