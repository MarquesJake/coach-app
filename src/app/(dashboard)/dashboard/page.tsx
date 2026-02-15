'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Club, Vacancy } from '@/lib/types/database'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/ui/metric-card'
import { PageHeader } from '@/components/ui/page-header'
import {
  PlusCircle,
  Search,
  BarChart3,
  Clock,
  Building2,
  Shield,
  ChevronRight,
  Users,
  UserCheck,
  UserMinus,
} from 'lucide-react'

interface CoachCounts {
  total: number
  available: number
  openToOffers: number
  underContract: number
}

export default function DashboardPage() {
  const [club, setClub] = useState<Club | null>(null)
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [coachCounts, setCoachCounts] = useState<CoachCounts>({
    total: 0,
    available: 0,
    openToOffers: 0,
    underContract: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError
        if (!user) {
          return
        }

        const {
          data: clubData,
          error: clubError,
        } = await supabase
          .from('clubs')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)

        if (clubError) throw clubError

        const myClub = clubData?.[0] ?? null
        if (!myClub) return

        if (!cancelled) setClub(myClub)

        const vacanciesQuery = supabase
          .from('vacancies')
          .select('*')
          .eq('club_id', myClub.id)
          .order('created_at', { ascending: false })

        const totalCoachesQuery = supabase
          .from('coaches')
          .select('id', { count: 'exact', head: true })

        const availableCoachesQuery = supabase
          .from('coaches')
          .select('id', { count: 'exact', head: true })
          .eq('available_status', 'Available')

        const openToOffersQuery = supabase
          .from('coaches')
          .select('id', { count: 'exact', head: true })
          .eq('available_status', 'Open to offers')

        const underContractQuery = supabase
          .from('coaches')
          .select('id', { count: 'exact', head: true })
          .in('available_status', ['Under contract', 'Under contract - interested'])

        const [vacsResult, totalResult, availableResult, openResult, contractResult] = await Promise.all([
          vacanciesQuery,
          totalCoachesQuery,
          availableCoachesQuery,
          openToOffersQuery,
          underContractQuery,
        ])

        if (vacsResult.error) throw vacsResult.error
        if (totalResult.error) throw totalResult.error
        if (availableResult.error) throw availableResult.error
        if (openResult.error) throw openResult.error
        if (contractResult.error) throw contractResult.error

        if (cancelled) return

        setVacancies(vacsResult.data || [])
        setCoachCounts({
          total: totalResult.count ?? 0,
          available: availableResult.count ?? 0,
          openToOffers: openResult.count ?? 0,
          underContract: contractResult.count ?? 0,
        })
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="h-6 w-40 rounded bg-surface-overlay/50 mb-2" />
        <div className="h-4 w-56 rounded bg-surface-overlay/50 mb-6" />

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-surface rounded-lg px-4 py-3.5">
              <div className="h-3 w-24 rounded bg-surface-overlay/50 mb-3" />
              <div className="h-6 w-10 rounded bg-surface-overlay/50" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card-surface rounded-lg px-4 py-3.5">
              <div className="h-3 w-24 rounded bg-surface-overlay/50 mb-3" />
              <div className="h-6 w-10 rounded bg-surface-overlay/50" />
            </div>
          ))}
        </div>

        <div className="card-surface rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/50">
            <div className="h-3 w-32 rounded bg-surface-overlay/50" />
          </div>
          <div className="p-5">
            <div className="h-4 w-44 rounded bg-surface-overlay/50 mb-3" />
            <div className="h-4 w-72 rounded bg-surface-overlay/50" />
          </div>
        </div>
      </div>
    )
  }

  const openVacancies = vacancies.filter(v => v.status === 'open')

  return (
    <div className="animate-fade-in">
      <PageHeader title={club?.name || 'Dashboard'} subtitle={club ? `${club.league} · ${club.country}` : undefined}>
        <Link
          href="/vacancies/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-xs rounded-md hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Search
        </Link>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          icon={<Search className="w-3.5 h-3.5" />}
          label="Active Searches"
          value={openVacancies.length}
          accentColor="text-primary"
        />
        <MetricCard
          icon={<BarChart3 className="w-3.5 h-3.5" />}
          label="Total Searches"
          value={vacancies.length}
        />
        <MetricCard
          icon={<Users className="w-3.5 h-3.5" />}
          label="Total Coaches"
          value={coachCounts.total}
        />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <MetricCard
          icon={<UserCheck className="w-3.5 h-3.5 text-emerald-400/60" />}
          label="Available"
          value={coachCounts.available}
          accentColor="text-emerald-400"
        />
        <MetricCard
          icon={<UserMinus className="w-3.5 h-3.5 text-yellow-400/60" />}
          label="Open to Offers"
          value={coachCounts.openToOffers}
          accentColor="text-yellow-400"
        />
        <MetricCard
          icon={<Shield className="w-3.5 h-3.5 text-orange-400/60" />}
          label="Under Contract"
          value={coachCounts.underContract}
          accentColor="text-orange-400"
        />
      </div>

      {/* Vacancies */}
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Recent Searches
            </h3>
            <Badge variant="secondary">{vacancies.length}</Badge>
          </div>
          <Link href="/matches" className="text-2xs text-muted-foreground hover:text-primary transition-colors">
            View all shortlists
          </Link>
        </div>

        {vacancies.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">No searches yet</p>
            <p className="text-2xs text-muted-foreground/60 mb-4">Create a vacancy to generate your first shortlist.</p>
            <Link
              href="/vacancies/new"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <PlusCircle className="w-3 h-3" />
              Start a new search
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {vacancies.map((v, i) => (
              <Link
                key={v.id}
                href={`/matches?vacancy=${v.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-overlay/30 transition-colors group animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center text-xs",
                    v.status === 'open'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-muted-foreground'
                  )}>
                    {v.role_type === 'Head Coach' ? (
                      <Building2 className="w-3.5 h-3.5" />
                    ) : (
                      <Shield className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">{v.role_type}</span>
                      <Badge variant={v.status === 'open' ? 'success' : 'outline'}>
                        {v.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xs text-muted-foreground">{v.objective}</span>
                      <span className="text-2xs text-muted-foreground/30">&middot;</span>
                      <span className="text-2xs text-muted-foreground">{v.style_of_play}</span>
                      <span className="text-2xs text-muted-foreground/30">&middot;</span>
                      <span className="text-2xs text-muted-foreground">{v.budget_range}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-2xs text-muted-foreground/50">
                    <Clock className="w-3 h-3" />
                    {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
