import { createServerSupabaseClient } from '@/lib/supabase/server'

export function db() {
  return createServerSupabaseClient()
}
