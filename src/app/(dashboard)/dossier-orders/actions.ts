'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'

type ActionResult = { ok: true } | { ok: false; error: string }

async function requireUser() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function publishDossierOfferAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const mandateId = String(formData.get('mandate_id') ?? '')
  const coachId = String(formData.get('coach_id') ?? '')
  const buyerOrganizationId = String(formData.get('buyer_organization_id') ?? '')
  const pricePounds = Number(formData.get('price_pounds') ?? 15000)
  if (!mandateId || !coachId || !buyerOrganizationId) return { ok: false, error: 'Missing offer context' }
  if (!Number.isFinite(pricePounds) || pricePounds < 0) return { ok: false, error: 'Invalid dossier fee' }
  const sellerOrganizationId = await getInternalOrganizationId(user.id)
  if (!sellerOrganizationId) return { ok: false, error: 'Internal organisation is not configured' }

  const [{ data: mandate }, { data: coach }, { data: recommendation }, { count: privateMaterialCount }, { data: brief }] = await Promise.all([
    supabase.from('mandates').select('id').eq('id', mandateId).eq('user_id', user.id).single(),
    supabase.from('coaches').select('id, name, role_current, club_current, nationality').eq('id', coachId).eq('user_id', user.id).single(),
    supabase.from('candidate_recommendations').select('verdict, confidence, summary, key_strengths, key_risks').eq('mandate_id', mandateId).eq('coach_id', coachId).eq('user_id', user.id).single(),
    supabase.from('coach_private_materials').select('id', { count: 'exact', head: true }).eq('coach_id', coachId).eq('user_id', user.id),
    supabase.from('club_briefs').select('id').eq('buyer_organization_id', buyerOrganizationId).eq('linked_mandate_id', mandateId).limit(1),
  ])
  if (!mandate || !coach || !recommendation) return { ok: false, error: 'Complete the candidate recommendation before publishing a dossier' }

  const { data: existingOffer } = await supabase
    .from('dossier_offers')
    .select('id, status')
    .eq('buyer_organization_id', buyerOrganizationId)
    .eq('mandate_id', mandateId)
    .eq('coach_id', coachId)
    .maybeSingle()
  if (existingOffer?.status === 'purchased') return { ok: false, error: 'This club already has an active dossier request' }

  const { data: offer, error } = await supabase.from('dossier_offers').upsert({
    seller_organization_id: sellerOrganizationId,
    buyer_organization_id: buyerOrganizationId,
    club_brief_id: brief?.[0]?.id ?? null,
    mandate_id: mandateId,
    coach_id: coachId,
    created_by: user.id,
    status: 'draft',
    headline: `${coach.name} — Head Coach Assessment`,
    preview_summary: recommendation.summary ?? 'A structured appointment recommendation based on Coach First evidence and football judgement.',
    fit_summary: 'Assessed against the club brief, squad context, leadership environment and nine-criterion Head Coach Assessment Methodology.',
    key_strengths: recommendation.key_strengths,
    key_risks: recommendation.key_risks,
    verdict: recommendation.verdict,
    confidence: recommendation.confidence,
    coach_name: coach.name,
    coach_current_role: coach.club_current ?? coach.role_current,
    coach_nationality: coach.nationality,
    included_sections: ['Executive recommendation', 'Club and squad fit', 'Nine-criterion assessment', 'Interview evidence', 'Structured references', 'Appointment feasibility', 'Controlled coach materials'],
    private_material_count: privateMaterialCount ?? 0,
    published_at: null,
    available_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'buyer_organization_id,mandate_id,coach_id' }).select('id').single()
  if (error || !offer) return { ok: false, error: 'Failed to prepare the club dossier preview' }

  const now = new Date().toISOString()
  const { error: commercialError } = await supabase.from('dossier_offer_commercials').upsert({
    offer_id: offer.id,
    seller_organization_id: sellerOrganizationId,
    price_amount: Math.round(pricePounds * 100),
    currency: 'GBP',
    created_by: user.id,
    updated_at: now,
  }, { onConflict: 'offer_id' })
  if (commercialError) return { ok: false, error: 'Failed to save the internal commercial terms' }

  const { error: publishError } = await supabase
    .from('dossier_offers')
    .update({ status: 'published', published_at: now, updated_at: now })
    .eq('id', offer.id)
    .eq('seller_organization_id', sellerOrganizationId)
  if (publishError) return { ok: false, error: 'Failed to publish the club dossier preview' }
  revalidatePath(`/mandates/${mandateId}/pack`)
  revalidatePath('/dossier-orders')
  revalidatePath('/club')
  revalidatePath('/club/dossiers')
  return { ok: true }
}

export async function approveDossierOrderAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const orderId = String(formData.get('order_id') ?? '')
  const materialIds = formData.getAll('material_id').map(String).filter(Boolean)
  const accessDays = Number(formData.get('access_days') ?? 30)
  const permitDownload = formData.get('permit_download') === 'on'
  const releaseNote = String(formData.get('release_note') ?? '').trim()
  if (!orderId || !materialIds.length) return { ok: false, error: 'Select at least one material' }
  const { error } = await supabase.rpc('approve_dossier_order', {
    target_order_id: orderId,
    material_ids: materialIds,
    access_days: accessDays,
    permit_download: permitDownload,
    release_note: releaseNote || undefined,
  })
  if (error) return { ok: false, error: 'Failed to approve the dossier release' }
  revalidatePath('/dossier-orders')
  revalidatePath('/club')
  revalidatePath('/club/dossiers')
  return { ok: true }
}

export async function revokeDossierAccessAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: 'Not authenticated' }
  const orderId = String(formData.get('order_id') ?? '')
  if (!orderId) return { ok: false, error: 'Missing order' }
  const { error } = await supabase.rpc('revoke_dossier_access', { target_order_id: orderId })
  if (error) return { ok: false, error: 'Failed to revoke access' }
  revalidatePath('/dossier-orders')
  revalidatePath('/club')
  revalidatePath('/club/dossiers')
  return { ok: true }
}
