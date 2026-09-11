'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { VERIFIED_EXAMPLES } from '@/lib/demo/verified-examples'
import { investorAccessIsActive, validateInvestorDraft } from '@/lib/investor/workspace'

export async function saveInvestorWorkspace(input: unknown) {
  const draft = validateInvestorDraft(input, VERIFIED_EXAMPLES.map(example => example.coachId))
  if (!draft) return { error: 'Check your draft: brief and notes must fit the limits and use the listed candidates.' }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Your session ended. Sign in again; your unsaved text is still on this page.' }
  const { data: access, error: accessError } = await supabase.from('investor_access').select('*').eq('user_id', user.id).maybeSingle()
  if (accessError) return { error: 'Evaluation access could not be confirmed. Keep your draft open and retry.' }
  if (!investorAccessIsActive(access)) return { error: 'Evaluation access has expired or been revoked. Contact your presenter.' }
  const { data, error } = await supabase.from('investor_workspaces').upsert({
    user_id: user.id, ...draft, updated_at: new Date().toISOString(),
  }).select('updated_at').single()
  if (error || !data) return { error: 'Save not confirmed. Keep this page open and retry when connected.' }
  revalidatePath('/investor')
  return { savedAt: data.updated_at }
}
