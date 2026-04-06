import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { coachId: string } }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ items: [] }, { status: 401 })

  const { data, error } = await supabase
    .from('intelligence_items')
    .select('id, direction, confidence, source_tier, category, title, sensitivity, occurred_at, created_at')
    .eq('entity_type', 'coach')
    .eq('entity_id', params.coachId)
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('occurred_at', { ascending: false })

  if (error) {
    console.error('[intelligence-items] query error:', error.message)
    return NextResponse.json({ items: [], error: error.message }, { status: 200 })
  }

  return NextResponse.json({ items: data ?? [] })
}
