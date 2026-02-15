'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coach, CoachUpdate } from '@/lib/types/database'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Section, SectionLabel, DataRow } from '@/components/ui/section'
import { cn } from '@/lib/utils'
import {
  Shield,
  Brain,
  Users,
  Wallet,
  FileText,
  Clock,
  Flag,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Briefcase,
  Globe,
} from 'lucide-react'

const AVAILABILITY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  'Available': 'success',
  'Open to offers': 'warning',
  'Under contract - interested': 'warning',
  'Under contract': 'danger',
  'Not available': 'secondary',
}

const REPUTATION_VARIANT: Record<string, 'purple' | 'info' | 'default' | 'secondary'> = {
  'Elite': 'purple',
  'Established': 'info',
  'Proven': 'default',
  'Emerging': 'secondary',
  'Rising': 'secondary',
}

const UPDATE_TYPE_COLOR: Record<string, string> = {
  'general': 'bg-zinc-500',
  'performance': 'bg-emerald-500',
  'tactical': 'bg-sky-500',
  'transfer': 'bg-amber-500',
  'injury': 'bg-red-500',
  'contract': 'bg-purple-500',
  'scouting': 'bg-teal-500',
  'rumour': 'bg-orange-400',
}

const UPDATE_TYPE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'secondary'> = {
  'general': 'secondary',
  'performance': 'success',
  'tactical': 'info',
  'transfer': 'warning',
  'injury': 'danger',
  'contract': 'purple',
  'scouting': 'default',
  'rumour': 'warning',
}

const LEADERSHIP_CONTEXT: Record<string, string> = {
  'Demanding': 'Sets high standards, expects total commitment from players and staff. Best suited to squads with experienced, mentally resilient players.',
  'Collaborative': 'Builds consensus, values player input in tactical decisions. Creates strong dressing room unity but may slow decision-making under pressure.',
  'Authoritarian': 'Top-down command structure with minimal player autonomy. Delivers fast results but can create friction with senior players.',
  'Player-focused': 'Prioritises individual player development and well-being. Strong at youth integration but may lack tactical rigidity.',
  'Motivational': 'Excels at man-management and getting the best from underperforming squads. Strong in relegation battles and turnaround situations.',
  'Disciplinarian': 'Enforces strict code of conduct on and off the pitch. Reduces squad indiscipline but may clash with high-profile personalities.',
  'Innovative': 'Pushes tactical boundaries and embraces data-driven methods. Appeals to modern ownership models but may need time to implement systems.',
}

const PRESSING_BAR: Record<string, number> = {
  'Low': 25, 'Medium-Low': 38, 'Medium': 50, 'Medium-High': 70, 'High': 85, 'Extreme': 100,
}

const BUILD_BAR: Record<string, number> = {
  'Direct': 20, 'Mixed': 50, 'Possession': 80, 'Short passing': 90, 'Long ball': 15,
}

const STYLE_BAR: Record<string, number> = {
  'Possession': 85, 'Counter-attacking': 60, 'High press': 90, 'Defensive': 30,
  'Transitional': 65, 'Tiki-taka': 95, 'Direct': 40, 'Gegenpressing': 92, 'Balanced': 55,
}

export default function CoachProfilePage({ params }: { params: { id: string } }) {
  const [coach, setCoach] = useState<Coach | null>(null)
  const [updates, setUpdates] = useState<CoachUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', params.id)
        .single()

      if (coachData) {
        setCoach(coachData)
        const { data: updatesData } = await supabase
          .from('coach_updates')
          .select('*')
          .eq('coach_id', params.id)
          .order('date_added', { ascending: false })
          .limit(10)
        setUpdates(updatesData || [])
      }
      setLoading(false)
    }
    load()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-primary" />
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Coach not found.</p>
        <Link href="/coaches" className="text-primary hover:text-primary/80 text-sm mt-2 inline-block">
          &larr; Back to database
        </Link>
      </div>
    )
  }

  const leadershipNote = LEADERSHIP_CONTEXT[coach.leadership_style] || null

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fade-in">
      {/* Back link */}
      <Link
        href="/coaches"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Coach Database
      </Link>

      {/* Header / Dossier Banner */}
      <div className="card-surface rounded-lg px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
              {coach.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {coach.current_role && (
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3 w-3 shrink-0" />
                  {coach.current_role}
                </span>
              )}
              {coach.current_club && (
                <span className="inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 shrink-0" />
                  {coach.current_club}
                </span>
              )}
              {coach.nationality && (
                <span className="inline-flex items-center gap-1">
                  <Flag className="h-3 w-3 shrink-0" />
                  {coach.nationality}
                </span>
              )}
              {coach.age && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" />
                  Age {coach.age}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant={AVAILABILITY_VARIANT[coach.available_status] || 'secondary'}>
              {coach.available_status}
            </Badge>
            {coach.reputation_tier && (
              <Badge variant={REPUTATION_VARIANT[coach.reputation_tier] || 'secondary'} className="opacity-70">
                {coach.reputation_tier}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Two-column dossier grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tactical Identity */}
          <Section
            title="Tactical Identity"
            badge={<Brain className="h-3.5 w-3.5 text-muted-foreground" />}
            variant="surface"
          >
            <div className="space-y-0">
              <DataRow label="Preferred Style" value={coach.preferred_style} />
              <DataRow label="Pressing Intensity" value={coach.pressing_intensity} />
              <DataRow label="Build Preference" value={coach.build_preference} />
            </div>

            <div className="mt-5">
              <SectionLabel className="mb-3 block">Tactical Signature</SectionLabel>
              <div className="card-inset rounded-md p-3.5 space-y-3">
                <TacticalBar
                  label="Style"
                  value={coach.preferred_style}
                  width={STYLE_BAR[coach.preferred_style] ?? 50}
                  color="bg-emerald-500/70"
                />
                <TacticalBar
                  label="Pressing"
                  value={coach.pressing_intensity}
                  width={PRESSING_BAR[coach.pressing_intensity] ?? 50}
                  color="bg-sky-500/70"
                />
                <TacticalBar
                  label="Build-up"
                  value={coach.build_preference}
                  width={BUILD_BAR[coach.build_preference] ?? 50}
                  color="bg-purple-500/70"
                />
              </div>
            </div>
          </Section>

          {/* Leadership & Culture */}
          <Section
            title="Leadership & Culture"
            badge={<Users className="h-3.5 w-3.5 text-muted-foreground" />}
            variant="surface"
          >
            <DataRow label="Leadership Style" value={coach.leadership_style} />
            {leadershipNote && (
              <div className="mt-3 card-inset rounded-md p-3.5">
                <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                  {leadershipNote}
                </p>
              </div>
            )}
          </Section>

          {/* Intelligence Notes Timeline */}
          <Section
            title="Intelligence Notes"
            badge={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
            variant="surface"
            action={
              updates.length > 0 ? (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {updates.length} {updates.length === 1 ? 'entry' : 'entries'}
                </span>
              ) : null
            }
          >
            {updates.length > 0 ? (
              <div className="space-y-0">
                {updates.map((update, idx) => {
                  const isLast = idx === updates.length - 1
                  const dotColor = UPDATE_TYPE_COLOR[update.update_type] || 'bg-zinc-500'
                  const typeVariant = UPDATE_TYPE_VARIANT[update.update_type] || 'secondary'

                  return (
                    <div
                      key={update.id}
                      className={cn(
                        'relative pl-9 pb-5',
                        !isLast && 'timeline-connector'
                      )}
                    >
                      <div
                        className={cn(
                          'absolute left-[11px] top-[5px] h-[9px] w-[9px] rounded-full ring-2 ring-[var(--card)]',
                          dotColor
                        )}
                      />

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {new Date(update.date_added).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <Badge variant={typeVariant}>{update.update_type}</Badge>
                        </div>

                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {update.update_note}
                        </p>

                        {(update.availability_change || update.reputation_shift) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {update.availability_change && (
                              <Badge variant="warning" className="text-[9px]">
                                <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                {update.availability_change}
                              </Badge>
                            )}
                            {update.reputation_shift && (
                              <Badge
                                variant={update.reputation_shift.toLowerCase().includes('up') ? 'success' : 'danger'}
                                className="text-[9px]"
                              >
                                {update.reputation_shift.toLowerCase().includes('up') ? (
                                  <TrendingUp className="h-2.5 w-2.5 mr-1" />
                                ) : (
                                  <TrendingDown className="h-2.5 w-2.5 mr-1" />
                                )}
                                {update.reputation_shift}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No intelligence updates available.</p>
            )}
          </Section>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-5">
          {/* Financial Profile */}
          <Section
            title="Financial Profile"
            badge={<Wallet className="h-3.5 w-3.5 text-muted-foreground" />}
            variant="surface"
          >
            <div className="space-y-0">
              <DataRow label="Wage Expectation" value={coach.wage_expectation} />
              <DataRow label="Staff Costs" value={coach.staff_cost_estimate} />
            </div>

            <div className="mt-4 card-inset rounded-md p-3.5">
              <SectionLabel className="mb-2 block">Total Package Estimate</SectionLabel>
              <p className="text-sm font-semibold text-foreground">
                {computePackageEstimate(coach.wage_expectation, coach.staff_cost_estimate)}
              </p>
              <div className="mt-2">
                <FeasibilityIndicator wage={coach.wage_expectation} />
              </div>
            </div>
          </Section>

          {/* Staff Ecosystem */}
          <Section
            title="Staff Ecosystem"
            badge={<Briefcase className="h-3.5 w-3.5 text-muted-foreground" />}
            variant="surface"
          >
            <DataRow label="Staff Cost Estimate" value={coach.staff_cost_estimate} />
            <div className="mt-3 card-inset rounded-md p-3.5">
              <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                {getStaffNote(coach.staff_cost_estimate)}
              </p>
            </div>
          </Section>

          {/* League Experience */}
          <Section
            title="League Experience"
            badge={<Globe className="h-3.5 w-3.5 text-muted-foreground" />}
            variant="surface"
          >
            {coach.league_experience && coach.league_experience.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {coach.league_experience.map((league) => (
                  <Badge key={league} variant="outline">
                    {league}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No league experience recorded.</p>
            )}
          </Section>
        </div>
      </div>

      {/* Bottom timestamp */}
      <div className="text-[10px] text-muted-foreground/50 text-right pb-4 tabular-nums">
        Dossier last refreshed: {new Date(coach.last_updated).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </div>
    </div>
  )
}

/* Helper Components */

function TacticalBar({ label, value, width, color }: { label: string; value: string; width: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
        <div
          className={cn('h-full rounded-full score-bar-track', color)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function computePackageEstimate(wage: string, staff: string): string {
  const parseRange = (s: string): [number, number] | null => {
    const nums = s.match(/[\d.]+/g)
    if (!nums || nums.length === 0) return null
    const values = nums.map(Number)
    if (values.length === 1) return [values[0], values[0]]
    return [values[0], values[values.length - 1]]
  }

  const wageRange = parseRange(wage)
  const staffRange = parseRange(staff)

  if (!wageRange && !staffRange) return 'Unable to estimate'
  if (!wageRange) return staff
  if (!staffRange) return wage

  const low = wageRange[0] + staffRange[0]
  const high = wageRange[1] + staffRange[1]

  const isMillions = wage.toLowerCase().includes('m') || staff.toLowerCase().includes('m')
  const suffix = isMillions ? 'M' : 'K'
  const prefix = wage.includes('\u00a3') || wage.includes('£') ? '£' : wage.includes('$') ? '$' : '€'

  if (low === high) return `${prefix}${low}${suffix} p/a`
  return `${prefix}${low}${suffix} - ${prefix}${high}${suffix} p/a`
}

function FeasibilityIndicator({ wage }: { wage: string }) {
  const lower = wage.toLowerCase()
  let level: 'low' | 'mid' | 'high' = 'mid'
  let label = 'Moderate outlay'

  if (lower.includes('low') || lower.includes('<1') || lower.includes('0.5')) {
    level = 'low'
    label = 'Low financial commitment'
  } else if (lower.includes('high') || lower.includes('premium') || lower.includes('5') || lower.includes('6') || lower.includes('7') || lower.includes('8')) {
    level = 'high'
    label = 'Significant investment required'
  }

  const colors = {
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    mid: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div className={cn('text-[10px] font-medium px-2.5 py-1.5 rounded border', colors[level])}>
      {label}
    </div>
  )
}

function getStaffNote(estimate: string): string {
  const lower = estimate.toLowerCase()
  if (lower.includes('large') || lower.includes('high') || lower.includes('premium')) {
    return 'Typically brings a full backroom staff of 8-12, including dedicated analysts, specialist coaches, and a personal fitness team. Expect significant support infrastructure costs.'
  }
  if (lower.includes('medium') || lower.includes('moderate') || lower.includes('mid')) {
    return 'Usually requires a core team of 4-6 support staff including an assistant manager, a set-piece coach, and fitness personnel. Moderate infrastructure overhead.'
  }
  return 'Tends to work with a lean backroom setup of 2-3 staff, often adapting to the existing coaching infrastructure at the club.'
}
