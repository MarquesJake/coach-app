import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { investorAccessIsActive } from '@/lib/investor/workspace'
import { InvestorWorkspace } from './workspace-client'
import { UnavailableInvestorAccess } from './_components/unavailable-access'

export const dynamic = 'force-dynamic'
export const metadata = { title: { absolute: 'Investor evaluation · Gaffa' }, robots: { index: false, follow: false } }

export default async function InvestorPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/investor/login')
  const { data: access, error: accessError } = await supabase.from('investor_access').select('*').eq('user_id', user.id).maybeSingle()
  if (accessError) throw new Error('Evaluation access could not be confirmed. Retry loading.')
  if (!investorAccessIsActive(access)) return <main className="mx-auto max-w-xl space-y-5 px-6 py-24">
    <h1 className="font-serif text-3xl">Evaluation access unavailable</h1>
    <p>Your access has ended or hasn’t been set up yet. Ask your Gaffa contact to check it.</p>
    <UnavailableInvestorAccess />
  </main>
  const { data: saved, error } = await supabase.from('investor_workspaces').select('*').eq('user_id', user.id).maybeSingle()
  if (error) throw new Error('Unable to load your evaluation workspace. Please retry.')
  return <InvestorWorkspace expiresAt={access!.expires_at} initial={saved ?? {
    brief: 'Appointment brief: set out the evidence the club needs before appointing a head coach. Compare the candidates below, define three priorities and the questions you would ask next.',
    shortlist: ['e59e9bcb-e51a-4a71-862b-dfd7909fcd6e', 'a2876420-b8a0-4544-9efd-e6483769e8cb', 'e75c98a2-c5c2-49be-af53-ec1295b0f75b'],
    notes: 'No appointment recommendation recorded. Employment terms, availability, references and club-specific fit are still to be confirmed.',
  }} />
}
