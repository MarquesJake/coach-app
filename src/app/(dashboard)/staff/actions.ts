'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'

type StaffInsert = Database['public']['Tables']['staff']['Insert']
type StaffUpdate = Database['public']['Tables']['staff']['Update']

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createStaffAction(input: { full_name: string; primary_role?: string | null; notes?: string | null }) {
  const { supabase, user } = await requireUser()
  const row: StaffInsert = {
    full_name: input.full_name.trim(),
    primary_role: input.primary_role?.trim() || null,
    notes: input.notes?.trim() || null,
    user_id: user.id,
  }
  const { data, error } = await supabase.from('staff').insert(row).select('id').single()
  if (!error) revalidatePath('/staff')
  return { data: data as { id: string } | null, error: error?.message ?? null }
}

export async function updateStaffAction(staffId: string, input: StaffUpdate) {
  const { supabase, user } = await requireUser()
  const { error } = await supabase.from('staff').update(input).eq('id', staffId).eq('user_id', user.id)
  if (!error) {
    revalidatePath('/staff')
    revalidatePath(`/staff/${staffId}`)
  }
  return { error: error?.message ?? null }
}
