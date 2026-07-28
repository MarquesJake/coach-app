import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function db() {
  return createServerSupabaseClient()
}
