import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Briefcase, ChevronRight, Plus } from 'lucide-react'
import { getMandatesForUser } from '@/lib/db/mandate'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createDemoMandateAction } from './actions'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function readSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function MandatesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: mandates, error } = await getMandatesForUser(user.id)

  if (error) {
    throw new Error(`Failed to load mandates: ${error.message}`)
  }

  const message = readSearchParam(searchParams?.error)

  return (
    <div className="max-w-[1400px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground uppercase tracking-wide">Mandates</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
            Client engagement management
          </p>
        </div>
        <Link
          href="/mandates/new"
          className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add mandate
        </Link>
      </div>

      {message && (
        <div className="rounded border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-400">
          {message}
        </div>
      )}

      {mandates.length === 0 ? (
        <div className="card-surface rounded-xl p-10 text-center">
          <Briefcase className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-foreground">No mandates yet</h2>
          <p className="text-xs text-muted-foreground mt-1">Add a mandate to begin tracking your engagement workflow</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/mandates/new"
              className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add mandate
            </Link>
            {process.env.NODE_ENV !== 'production' && (
              <form action={createDemoMandateAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-3 h-9 bg-surface border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-overlay/30 transition-colors"
                >
                  Create demo mandate
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="card-surface rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background/40">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Club</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Priority</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Engagement date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target completion</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mandates.map((mandate) => (
                  <tr key={mandate.id} className="hover:bg-surface-overlay/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{mandate.clubs?.name ?? 'Unknown club'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{mandate.status}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{mandate.priority}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(mandate.engagement_date)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(mandate.target_completion_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/mandates/${mandate.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
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
      )}
    </div>
  )
}
