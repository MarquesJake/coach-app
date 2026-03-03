import { db } from './client'
import type { Database } from '@/lib/types/db'

type ClubRow = Database['public']['Tables']['clubs']['Row']
type ClubInsert = Database['public']['Tables']['clubs']['Insert']
type ClubUpdate = Database['public']['Tables']['clubs']['Update']

export type { ClubRow, ClubInsert, ClubUpdate }

export async function getClubsForUser(userId: string) {
  const supabase = db()
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, league, country, notes')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  return { data: data as (Pick<ClubRow, 'id' | 'name' | 'league' | 'country' | 'notes'>)[], error }
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
