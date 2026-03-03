import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'

type StaffRow = Database['public']['Tables']['staff']['Row']
type StaffInsert = Database['public']['Tables']['staff']['Insert']
type StaffUpdate = Database['public']['Tables']['staff']['Update']

export type { StaffRow, StaffInsert, StaffUpdate }

export async function getStaffForUser(userId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .order('full_name', { ascending: true })
  return { data: (data ?? []) as StaffRow[], error }
}

export async function getStaffById(userId: string, staffId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .eq('user_id', userId)
    .single()
  return { data: data as StaffRow | null, error }
}

export async function createStaff(userId: string, input: { full_name: string; primary_role?: string | null; specialties?: string[]; notes?: string | null }) {
  const supabase = createServerSupabaseClient()
  return supabase
    .from('staff')
    .insert({ ...input, user_id: userId })
    .select('id')
    .single()
}

export async function updateStaff(userId: string, staffId: string, input: StaffUpdate) {
  const supabase = createServerSupabaseClient()
  return supabase.from('staff').update(input).eq('id', staffId).eq('user_id', userId).select().single()
}
