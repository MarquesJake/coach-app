import { db } from './client'
import type { Database } from '@/lib/types/db'

type ClubRow = Database['public']['Tables']['clubs']['Row']
type ClubInsert = Database['public']['Tables']['clubs']['Insert']
type ClubUpdate = Database['public']['Tables']['clubs']['Update']
type CoachingHistoryRow = Database['public']['Tables']['club_coaching_history']['Row']
type CoachingHistoryInsert = Database['public']['Tables']['club_coaching_history']['Insert']
type SeasonResultRow = Database['public']['Tables']['club_season_results']['Row']
type SeasonResultInsert = Database['public']['Tables']['club_season_results']['Insert']

export type { ClubRow, ClubInsert, ClubUpdate, CoachingHistoryRow, CoachingHistoryInsert, SeasonResultRow, SeasonResultInsert }

export async function getClubsForUser(userId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, league, country, tier, notes')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  return { data: data as (Pick<ClubRow, 'id' | 'name' | 'league' | 'country' | 'tier' | 'notes'>)[], error }
}

export async function getClubById(userId: string, clubId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', clubId)
    .eq('user_id', userId)
    .single()
  return { data: data as ClubRow | null, error }
}

export async function createClub(userId: string, input: Omit<ClubInsert, 'user_id'>) {
  const supabase = db()
  return supabase.from('clubs').insert({ ...input, user_id: userId }).select('id').single()
}

export async function updateClub(userId: string, clubId: string, input: ClubUpdate) {
  const supabase = db()
  return supabase.from('clubs').update(input).eq('id', clubId).eq('user_id', userId).select('id').single()
}

export async function deleteClub(userId: string, clubId: string) {
  const supabase = db()
  return supabase.from('clubs').delete().eq('id', clubId).eq('user_id', userId)
}

// ── Coaching history ─────────────────────────────────────────────────────────

export async function listClubCoachingHistory(userId: string, clubId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('club_coaching_history')
    .select('*')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .order('start_date', { ascending: false })
  return { data: (data ?? []) as CoachingHistoryRow[], error }
}

export async function createClubCoachingHistoryEntry(userId: string, input: Omit<CoachingHistoryInsert, 'user_id'>) {
  const supabase = db()
  return supabase.from('club_coaching_history').insert({ ...input, user_id: userId }).select('id').single()
}

export async function deleteClubCoachingHistoryEntry(userId: string, entryId: string) {
  const supabase = db()
  return supabase.from('club_coaching_history').delete().eq('id', entryId).eq('user_id', userId)
}

// ── Season results ───────────────────────────────────────────────────────────

export async function listClubSeasonResults(userId: string, clubId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('club_season_results')
    .select('*')
    .eq('user_id', userId)
    .eq('club_id', clubId)
    .order('season', { ascending: false })
  return { data: (data ?? []) as SeasonResultRow[], error }
}

export async function createClubSeasonResult(userId: string, input: Omit<SeasonResultInsert, 'user_id'>) {
  const supabase = db()
  return supabase.from('club_season_results').insert({ ...input, user_id: userId }).select('id').single()
}

export async function deleteClubSeasonResult(userId: string, resultId: string) {
  const supabase = db()
  return supabase.from('club_season_results').delete().eq('id', resultId).eq('user_id', userId)
}
