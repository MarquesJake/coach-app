import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'
import { CoachTabNav } from './_components/coach-tab-nav'
import { CoachCommandBar } from './_components/coach-command-bar'
import { summariseEvidence } from '@/lib/decision-workflow'
import { ResearchContextBanner } from '../_components/research-context-link'
import type { Metadata } from 'next'
import { CurrentEmploymentNotice } from '@/components/assessment/current-employment'
import { researchProfileForName } from '@/lib/scoring/research/catalogue'

// Names the entity in the tab so several open records can be told apart; child
// tabs supply their own label through the template ("Career · Kieran McKenna").
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from('coaches').select('name').eq('id', id).maybeSingle()
  const name = data?.name?.trim() || 'Coach'
  return { title: { default: name, template: `%s · ${name} · Gaffa` } }
}

export default async function CoachDetailLayout({children,params}:{children:React.ReactNode;params:Promise<{id:string}>}) {
 const {id}=await params;const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/login')
 const [{data:coach},claims,watchlist]=await Promise.all([
  getCoachById(id),db.from('profile_claims').select('id,claimed_value,evidence_summary,source_name,verification_status,review_status,occurred_at').eq('coach_id',id),
  db.from('watchlist_coaches').select('coach_id').eq('coach_id',id).maybeSingle()
 ])
 if(!coach)notFound()
 const summary=summariseEvidence(claims.data??[])
 const evidenceLabel = claims.error ? 'Evidence unavailable' : researchProfileForName(coach.name) && summary.label === 'Needs research' ? 'Football research sourced · diligence pending' : summary.label
 return <div className="min-w-0 max-w-full space-y-4"><ResearchContextBanner/><CoachCommandBar coachId={id} coach={coach as Record<string,unknown>} evidenceLabel={evidenceLabel} onWatchlist={!!watchlist.data}/><CurrentEmploymentNotice name={coach.name}/><CoachTabNav coachId={id}/><div className="min-w-0 max-w-full break-words">{children}</div></div>
}
