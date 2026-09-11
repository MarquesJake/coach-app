'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import { staffDetails, type StaffDetails } from '@/lib/staff/forms'

type StaffInsert = Database['public']['Tables']['staff']['Insert']

async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createStaffAction(input: { full_name: string; primary_role?: string | null; notes?: string | null }) {
  const { supabase, user } = await requireUser()
  if (!input.full_name?.trim()) return { data: null, error: 'Full name is required' }
  const row: StaffInsert = {
    ...staffDetails(input),
    user_id: user.id,
  }
  const { data, error } = await supabase.from('staff').insert(row).select('id').single()
  if (!error) revalidatePath('/staff')
  return { data: data as { id: string } | null, error: error?.message ?? null }
}

export async function updateStaffAction(staffId: string, input: StaffDetails) {
  const { supabase } = await requireUser()
  if (!input.full_name?.trim()) return { error: 'Full name is required' }
  const { error } = await supabase.from('staff').update(staffDetails(input)).eq('id', staffId).select('id').single()
  if (!error) {
    revalidatePath('/staff')
    revalidatePath(`/staff/${staffId}`)
  }
  return { error: error?.message ?? null }
}
