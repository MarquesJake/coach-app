'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { runMatchingForVacancy } from '@/lib/matchmaking'
import type { Database } from '@/lib/types/db'

type VacancyRow = Database['public']['Tables']['vacancies']['Row']
type MatchRow = Database['public']['Tables']['matches']['Row']
type CoachRow = Database['public']['Tables']['coaches']['Row']

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function runMatchingAction(vacancyId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser()
    await runMatchingForVacancy(supabase, vacancyId, user.id)
    revalidatePath('/matches')
    revalidatePath(`/matches?vacancy=${vacancyId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Matching failed' }
  }
}

function buildExecutiveBrief(
  vacancy: VacancyRow,
  matches: (MatchRow & { coaches: Pick<CoachRow, 'name' | 'role_current' | 'club_current' | 'available_status'> | null })[]
): string {
  const top5 = matches.slice(0, 5)
  const lines: string[] = []

  lines.push('Vacancy Summary')
  lines.push('─'.repeat(40))
  lines.push(`Objective: ${vacancy.objective}`)
  lines.push(`Style: ${vacancy.style_of_play} · ${vacancy.build_style}`)
  lines.push(`Budget: ${vacancy.budget_range}`)
  lines.push(`Timeline: ${vacancy.timeline}`)
  lines.push('')

  lines.push('Top 5 Ranked Coaches')
  lines.push('─'.repeat(40))
  top5.forEach((m, i) => {
    const c = m.coaches
    const name = c?.name ?? 'Unknown'
    const role = c?.role_current ?? ''
    const club = c?.club_current ?? ''
    const status = c?.available_status ?? ''
    const overall = m.overall_score ?? 0
    lines.push(`${i + 1}. ${name} — ${role}${club ? ` at ${club}` : ''} (${status}) · Score: ${overall}`)
  })
  lines.push('')

  lines.push('Key Strengths')
  lines.push('─'.repeat(40))
  const highOverall = top5.filter((m) => (m.overall_score ?? 0) >= 70)
  const highFinancial = top5.filter((m) => (m.financial_fit_score ?? 0) >= 70)
  if (highOverall.length > 0) {
    lines.push(`• ${highOverall.length} candidate(s) with overall score ≥ 70`)
  }
  if (highFinancial.length > 0) {
    lines.push(`• ${highFinancial.length} candidate(s) with strong financial fit`)
  }
  lines.push('')

  lines.push('Risk Considerations')
  lines.push('─'.repeat(40))
  const contracted = top5.filter((m) => {
    const s = m.coaches?.available_status ?? ''
    return s === 'Under contract' || s === 'Not available'
  })
  if (contracted.length > 0) {
    lines.push(`• ${contracted.length} shortlisted candidate(s) currently under contract or unavailable`)
  }
  const lowAvail = top5.filter((m) => (m.availability_score ?? 0) < 50)
  if (lowAvail.length > 0) {
    lines.push(`• ${lowAvail.length} candidate(s) with limited availability`)
  }
  if (contracted.length === 0 && lowAvail.length === 0) {
    lines.push('• No major availability risks in top 5')
  }
  lines.push('')

  lines.push('Recommendation')
  lines.push('─'.repeat(40))
  if (top5.length > 0) {
    const best = top5[0]
    const name = best.coaches?.name ?? 'Leading candidate'
    lines.push(`Proceed with focused engagement on ${name} and the next two ranked candidates. Review financial and cultural fit before board presentation.`)
  } else {
    lines.push('Run matching to generate a shortlist, then review and refine criteria if needed.')
  }

  return lines.join('\n')
}

export async function generateBriefAction(vacancyId: string): Promise<{ error?: string }> {
  try {
    const { supabase, user } = await requireUser()

    const { data: clubs } = await supabase.from('clubs').select('id').eq('user_id', user.id)
    const clubIds = (clubs ?? []).map((c) => c.id)
    if (clubIds.length === 0) return { error: 'No clubs found' }

    const { data: vacancy, error: vacError } = await supabase
      .from('vacancies')
      .select('*')
      .eq('id', vacancyId)
      .single()

    if (vacError || !vacancy) return { error: 'Vacancy not found' }
    if (!clubIds.includes(vacancy.club_id)) return { error: 'Vacancy not found' }

    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('*, coaches(name, role_current, club_current, available_status)')
      .eq('vacancy_id', vacancyId)
      .order('overall_score', { ascending: false })

    if (matchError) return { error: matchError.message }

    const brief = buildExecutiveBrief(vacancy as VacancyRow, (matches ?? []) as (MatchRow & { coaches: Pick<CoachRow, 'name' | 'role_current' | 'club_current' | 'available_status'> | null })[])

    const { error: updateError } = await supabase
      .from('vacancies')
      .update({ executive_brief: brief })
      .eq('id', vacancyId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/matches')
    revalidatePath(`/matches?vacancy=${vacancyId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to generate brief' }
  }
}
