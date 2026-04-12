import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MandateBuilderForm } from '../../_components/mandate-builder-form'

export default async function MandateEditPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: mandate, error } = await supabase
    .from('mandates')
    .select(`
      id, strategic_objective, tactical_model_required, pressing_intensity_required,
      build_preference_required, leadership_profile_required, budget_band,
      succession_timeline, board_risk_appetite, language_requirements, relocation_required,
      custom_club_name,
      clubs ( name )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !mandate) notFound()

  const clubName = mandate.custom_club_name
    ?? (mandate.clubs as { name: string | null } | null)?.name
    ?? undefined

  return (
    <div className="px-4 py-6">
      <MandateBuilderForm
        mode="edit"
        mandateId={params.id}
        clubName={clubName}
        backHref={`/mandates/${params.id}`}
        initialValues={{
          strategic_objective: mandate.strategic_objective ?? undefined,
          tactical_model_required: mandate.tactical_model_required ?? undefined,
          pressing_intensity_required: mandate.pressing_intensity_required ?? undefined,
          build_preference_required: mandate.build_preference_required ?? undefined,
          leadership_profile_required: mandate.leadership_profile_required ?? undefined,
          budget_band: mandate.budget_band ?? undefined,
          succession_timeline: mandate.succession_timeline ?? undefined,
          board_risk_appetite: mandate.board_risk_appetite ?? undefined,
          language_requirements: mandate.language_requirements?.join(', ') ?? undefined,
          relocation_required: mandate.relocation_required ?? undefined,
        }}
      />
    </div>
  )
}
