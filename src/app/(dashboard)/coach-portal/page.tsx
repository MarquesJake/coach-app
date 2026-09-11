import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/db'
import { cn } from '@/lib/utils'
import { calculateProfileReadiness } from '@/lib/coach-profile-readiness'
import { declarationReviewLabel, submissionQueueRank, summarizeMaterials } from '@/lib/assessment/material-status'
import { isIllustrativeEvidence } from '@/lib/assessment/evidence-integrity'

export const metadata = { title: 'Coach submissions' }


type CoachRow = Pick<
  Database['public']['Tables']['coaches']['Row'],
  'id' | 'name' | 'club_current' | 'nationality' | 'availability_status' | 'available_status' | 'tactical_identity'
>
type PortalRow = Database['public']['Tables']['coach_portal_profiles']['Row']
type MaterialRow = Pick<
  Database['public']['Tables']['coach_private_materials']['Row'],
  'id' | 'coach_id' | 'material_type' | 'confidentiality_status' | 'verification_status' | 'storage_path' | 'upload_status' | 'external_url' | 'title' | 'description' | 'source_label'
>
type AccessRequestRow = Pick<
  Database['public']['Tables']['confidential_access_requests']['Row'],
  'id' | 'coach_id' | 'status'
>
type CoachInvitationRow = Pick<
  Database['public']['Tables']['coach_invitations']['Row'],
  'id' | 'coach_id' | 'status'
>
type AssessmentRow = Pick<
  Database['public']['Tables']['candidate_assessments']['Row'],
  'coach_id'
>

function readiness(profile: PortalRow | null, materials: MaterialRow[]) {
  return calculateProfileReadiness(profile, summarizeMaterials(materials).uploaded)
}

function statusTone(status: string) {
  if (status === 'approved') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
  if (status === 'submitted' || status === 'in_review') return 'border-blue-500/30 bg-blue-500/10 text-blue-300'
  if (status === 'needs_update') return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  if (status === 'in_progress' || status === 'invited') return 'border-primary/30 bg-primary/10 text-primary'
  return 'border-border bg-surface text-muted-foreground'
}

export default async function CoachPortalPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [coachesRes, profilesRes, materialsRes, accessRequestsRes, invitationsRes, assessmentsRes] = await Promise.all([
    supabase
      .from('coaches')
      .select('id, name, club_current, nationality, availability_status, available_status, tactical_identity')
      .order('name'),
    supabase
      .from('coach_portal_profiles')
      .select('*'),
    supabase
      .from('coach_private_materials')
      .select('id, coach_id, material_type, confidentiality_status, verification_status, storage_path, upload_status, external_url, title, description, source_label'),
    supabase
      .from('confidential_access_requests')
      .select('id, coach_id, status'),
    supabase
      .from('coach_invitations')
      .select('id, coach_id, status')
      .in('status', ['pending', 'accepted']),
    supabase
      .from('candidate_assessments')
      .select('coach_id'),
  ])

  if (coachesRes.error || profilesRes.error || materialsRes.error || accessRequestsRes.error || invitationsRes.error || assessmentsRes.error) {
    throw new Error('Coach submissions could not be loaded. Refresh to retry.')
  }

  const allCoaches = (coachesRes.data ?? []) as CoachRow[]
  const profiles = new Map((profilesRes.data ?? []).map((profile) => [profile.coach_id, profile as PortalRow]))
  const materials = (materialsRes.data ?? []) as MaterialRow[]
  const materialsByCoach = new Map<string, MaterialRow[]>()
  for (const material of materials) {
    materialsByCoach.set(material.coach_id, [...(materialsByCoach.get(material.coach_id) ?? []), material])
  }
  const accessRequests = (accessRequestsRes.data ?? []) as AccessRequestRow[]
  const accessRequestsByCoach = new Map<string, AccessRequestRow[]>()
  for (const request of accessRequests) {
    accessRequestsByCoach.set(request.coach_id, [...(accessRequestsByCoach.get(request.coach_id) ?? []), request])
  }
  const invitations = (invitationsRes.data ?? []) as CoachInvitationRow[]
  const assessedCoachIds = new Set(
    ((assessmentsRes.data ?? []) as AssessmentRow[]).map((assessment) => assessment.coach_id)
  )
  const activeCoachIds = new Set<string>([
    ...Array.from(profiles.keys()),
    ...materials.map((material) => material.coach_id),
    ...accessRequests.map((request) => request.coach_id),
    ...invitations.map((invitation) => invitation.coach_id),
    ...Array.from(assessedCoachIds),
  ])
  const coaches = allCoaches.filter((coach) => activeCoachIds.has(coach.id))
    .sort((a, b) => submissionQueueRank(profiles.get(a.id)?.portal_status) - submissionQueueRank(profiles.get(b.id)?.portal_status))

  const withPortal = coaches.filter((coach) => profiles.has(coach.id)).length
  const awaitingReview = (profilesRes.data ?? []).filter((profile) => submissionQueueRank(profile.portal_status) < 3).length
  const liveAccessRequests = accessRequests.filter((request) => ['requested', 'approved'].includes(request.status)).length
  const readyForClub = coaches.filter((coach) => {
    const profile = profiles.get(coach.id) ?? null
    return readiness(profile, materialsByCoach.get(coach.id) ?? []) >= 70
  }).length

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Coach access and submissions</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Coach profile and material review
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Manage invited coaches, check what they send us and control their private material before any of it is used with a club.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Active records', value: coaches.length },
            { label: 'Needs review or update', value: awaitingReview },
            { label: 'Profiles at 70% completeness', value: readyForClub },
            { label: 'Live requests', value: liveAccessRequests },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-semibold text-foreground tabular-nums">{item.value}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Submission review queue</h2>
            <p className="text-2xs text-muted-foreground mt-0.5">
              New submissions and updates first. How complete a profile is doesn’t mean it has been checked or can be shared.
            </p>
          </div>
          <div className="text-2xs text-muted-foreground">
            {withPortal} portal profile{withPortal === 1 ? '' : 's'}
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {coaches.length === 0 ? (
            <div className="px-5 py-10 text-sm text-muted-foreground">
              No coaches waiting on an assessment, invitation or material review.
            </div>
          ) : (
            coaches.map((coach) => {
              const profile = profiles.get(coach.id) ?? null
              const coachMaterials = materialsByCoach.get(coach.id) ?? []
              const score = readiness(profile, coachMaterials)
              const status = profile?.portal_status ?? 'not_invited'
              const materialSummary = summarizeMaterials(coachMaterials)
              return (
                <Link
                  key={coach.id}
                  href={`/coach-portal/${coach.id}`}
                  className="grid grid-cols-1 gap-3 px-5 py-4 hover:bg-surface/50 transition-colors md:grid-cols-[minmax(0,1.5fr)_150px_120px_140px_110px_auto] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{coach.name}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5 truncate">
                      {[coach.club_current, coach.nationality, coach.tactical_identity].filter(Boolean).join(' · ') || 'Profile context missing'}
                    </p>
                  </div>
                  <span className={cn('justify-self-start rounded-full border px-2 py-1 text-[10px] font-medium', statusTone(profile && isIllustrativeEvidence(profile) ? 'needs_update' : status))}>
                    {declarationReviewLabel(profile)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground tabular-nums">{score}%</p>
                    <p className="text-[10px] text-muted-foreground">{profile && isIllustrativeEvidence(profile) ? 'Illustrative profile completeness' : 'Profile completeness'}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {materialSummary.entries} entries · {materialSummary.uploaded} uploads · {materialSummary.reviewedUploads} reviewed uploads
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(accessRequestsByCoach.get(coach.id) ?? []).length} request{(accessRequestsByCoach.get(coach.id) ?? []).length === 1 ? '' : 's'}
                  </p>
                  <span className="text-2xs font-medium text-primary">Review submission →</span>
                </Link>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
