import { db } from './client'
import type { Database } from '@/lib/types/db'

type MatchRow = Database['public']['Tables']['matches']['Row']
type MatchInsert = Database['public']['Tables']['matches']['Insert']

export type { MatchRow, MatchInsert }

export async function getMatchesForVacancy(vacancyId: string) {
  const supabase = db()
  return supabase
    .from('matches')
    .select('*, coaches(id, name, role_current, club_current, available_status)')
    .eq('vacancy_id', vacancyId)
    .order('overall_score', { ascending: false })
}

export async function getVacancyById(userId: string, vacancyId: string) {
  const supabase = db()
  const { data: clubs } = await supabase.from('clubs').select('id').eq('user_id', userId)
  const clubIds = (clubs ?? []).map((c) => c.id)
  const { data, error } = await supabase
    .from('vacancies')
    .select('*')
    .eq('id', vacancyId)
    .single()
  if (error || !data) return { data: null, error }
  if (!clubIds.includes(data.club_id)) return { data: null, error: new Error('Not found') }
  return { data, error: null }
}

export async function getVacanciesForUser(userId: string) {
  const supabase = db()
  const { data: clubs } = await supabase.from('clubs').select('id').eq('user_id', userId)
  const clubIds = (clubs ?? []).map((c) => c.id)
  if (clubIds.length === 0) return { data: [] as Database['public']['Tables']['vacancies']['Row'][], error: null }
  const { data, error } = await supabase
    .from('vacancies')
    .select('*')
    .in('club_id', clubIds)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}
