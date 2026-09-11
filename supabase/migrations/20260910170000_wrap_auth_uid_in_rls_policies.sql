-- Wrap auth.uid() in a scalar subselect across all public RLS policies.
--
-- Postgres re-evaluates a bare auth.uid() once per row; wrapping it as
-- (select auth.uid()) lets the planner hoist it into an InitPlan evaluated
-- once per statement. This is a pure performance change -- the value returned
-- is identical, so every policy keeps exactly the same semantics and the same
-- roles and command (ALTER POLICY touches only USING / WITH CHECK).
--
-- Generated from pg_policies. Addresses the Supabase performance advisor lint
-- auth_rls_initplan.

begin;

alter policy "Users can insert own activity log" on public.activity_log with check (((select auth.uid()) = user_id));

alter policy "Users can view own activity log" on public.activity_log using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.activity_log using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy agent_club_delete on public.agent_club_relationships using (((select auth.uid()) = user_id));

alter policy agent_club_insert on public.agent_club_relationships with check (((select auth.uid()) = user_id));

alter policy agent_club_relationships_delete_own on public.agent_club_relationships using (((select auth.uid()) = user_id));

alter policy agent_club_relationships_insert_own on public.agent_club_relationships with check (((select auth.uid()) = user_id));

alter policy agent_club_relationships_select_own on public.agent_club_relationships using (((select auth.uid()) = user_id));

alter policy agent_club_relationships_update_own on public.agent_club_relationships using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy agent_club_select on public.agent_club_relationships using (((select auth.uid()) = user_id));

alter policy agent_club_update on public.agent_club_relationships using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.agent_club_relationships using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy agent_deals_delete on public.agent_deals using (((select auth.uid()) = user_id));

alter policy agent_deals_insert on public.agent_deals with check (((select auth.uid()) = user_id));

alter policy agent_deals_select on public.agent_deals using (((select auth.uid()) = user_id));

alter policy agent_deals_update on public.agent_deals using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.agent_deals using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy agent_interactions_delete on public.agent_interactions using (((select auth.uid()) = user_id));

alter policy agent_interactions_insert on public.agent_interactions with check (((select auth.uid()) = user_id));

alter policy agent_interactions_select on public.agent_interactions using (((select auth.uid()) = user_id));

alter policy agent_interactions_update on public.agent_interactions using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.agent_interactions using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy agents_delete on public.agents using (((select auth.uid()) = user_id));

alter policy agents_delete_own on public.agents using (((select auth.uid()) = user_id));

alter policy agents_insert on public.agents with check (((select auth.uid()) = user_id));

alter policy agents_insert_own on public.agents with check (((select auth.uid()) = user_id));

alter policy agents_select on public.agents using (((select auth.uid()) = user_id));

alter policy agents_select_own on public.agents using (((select auth.uid()) = user_id));

alter policy agents_update on public.agents using (((select auth.uid()) = user_id));

alter policy agents_update_own on public.agents using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.agents using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy alerts_insert_own on public.alerts with check (((select auth.uid()) = user_id));

alter policy alerts_select_own on public.alerts using (((select auth.uid()) = user_id));

alter policy alerts_update_own on public.alerts using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.alerts using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create appointment_outcomes" on public.appointment_outcomes with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.appointment_outcomes using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own assessment evidence" on public.assessment_evidence using (((select auth.uid()) = user_id));

alter policy "Users can insert own assessment evidence" on public.assessment_evidence with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = assessment_evidence.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = assessment_evidence.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own assessment evidence" on public.assessment_evidence using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = assessment_evidence.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = assessment_evidence.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own assessment evidence" on public.assessment_evidence using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.assessment_evidence using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own candidate assessments" on public.candidate_assessments using (((select auth.uid()) = user_id));

alter policy "Users can insert own candidate assessments" on public.candidate_assessments with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_assessments.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_assessments.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own candidate assessments" on public.candidate_assessments using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_assessments.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_assessments.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own candidate assessments" on public.candidate_assessments using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.candidate_assessments using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own candidate interview answers" on public.candidate_interview_answers using (((select auth.uid()) = user_id));

alter policy "Users can insert own candidate interview answers" on public.candidate_interview_answers with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_interview_answers.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_interview_answers.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own candidate interview answers" on public.candidate_interview_answers using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_interview_answers.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_interview_answers.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own candidate interview answers" on public.candidate_interview_answers using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.candidate_interview_answers using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own candidate recommendations" on public.candidate_recommendations using (((select auth.uid()) = user_id));

alter policy "Users can insert own candidate recommendations" on public.candidate_recommendations with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_recommendations.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_recommendations.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own candidate recommendations" on public.candidate_recommendations using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_recommendations.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_recommendations.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own candidate recommendations" on public.candidate_recommendations using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.candidate_recommendations using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own candidate reference answers" on public.candidate_reference_answers using (((select auth.uid()) = user_id));

alter policy "Users can insert own candidate reference answers" on public.candidate_reference_answers with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_reference_answers.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_reference_answers.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own candidate reference answers" on public.candidate_reference_answers using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = candidate_reference_answers.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = candidate_reference_answers.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own candidate reference answers" on public.candidate_reference_answers using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.candidate_reference_answers using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create claim_relationships" on public.claim_relationships with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.claim_relationships using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Club decision makers request amendments" on public.club_brief_amendments with check (((requested_by = (select auth.uid())) AND (status = 'pending'::text) AND (EXISTS ( SELECT 1
   FROM (club_briefs b
     JOIN organizations o ON ((o.id = b.buyer_organization_id)))
  WHERE ((b.id = club_brief_amendments.brief_id) AND (o.status = 'active'::text) AND (o.organization_type = 'club'::text) AND is_organization_member(o.id, ARRAY['owner'::text, 'admin'::text, 'club_owner'::text, 'club_director'::text]))))));

alter policy "Service analysts decide amendments" on public.club_brief_amendments using (((status = 'pending'::text) AND (EXISTS ( SELECT 1
   FROM (club_briefs b
     JOIN organizations o ON ((o.id = b.service_organization_id)))
  WHERE ((b.id = club_brief_amendments.brief_id) AND (o.status = 'active'::text) AND (o.organization_type = 'internal'::text) AND is_organization_member(o.id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])))))) with check (((status = ANY (ARRAY['accepted'::text, 'declined'::text])) AND (reviewed_by = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM (club_briefs b
     JOIN organizations o ON ((o.id = b.service_organization_id)))
  WHERE ((b.id = club_brief_amendments.brief_id) AND (o.status = 'active'::text) AND (o.organization_type = 'internal'::text) AND is_organization_member(o.id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text]))))));

alter policy "Club decision makers can create briefs" on public.club_briefs with check (((created_by = (select auth.uid())) AND is_organization_member(buyer_organization_id, ARRAY['owner'::text, 'admin'::text, 'club_owner'::text, 'club_director'::text])));

alter policy investor_internal_data_fence on public.club_briefs using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy club_coaching_history_delete on public.club_coaching_history using (((select auth.uid()) = user_id));

alter policy club_coaching_history_insert on public.club_coaching_history with check (((select auth.uid()) = user_id));

alter policy club_coaching_history_select on public.club_coaching_history using (((select auth.uid()) = user_id));

alter policy club_coaching_history_update on public.club_coaching_history using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.club_coaching_history using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.club_data_sync_log using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "users own sync log" on public.club_data_sync_log using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.club_invitations using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy club_pathway_data_user_policy on public.club_pathway_data using ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.club_pathway_data using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy club_season_results_delete on public.club_season_results using (((select auth.uid()) = user_id));

alter policy club_season_results_insert on public.club_season_results with check (((select auth.uid()) = user_id));

alter policy club_season_results_select on public.club_season_results using (((select auth.uid()) = user_id));

alter policy club_season_results_update on public.club_season_results using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.club_season_results using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.club_squad using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "users own squad" on public.club_squad using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy club_transfers_user_policy on public.club_transfers using ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.club_transfers using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "users own transfers" on public.club_transfers using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy "Users can delete own clubs" on public.clubs using (((select auth.uid()) = user_id));

alter policy "Users can insert own clubs" on public.clubs with check (((select auth.uid()) = user_id));

alter policy "Users can insert their own club" on public.clubs with check (((select auth.uid()) = user_id));

alter policy "Users can update own clubs" on public.clubs using (((select auth.uid()) = user_id));

alter policy "Users can update their own club" on public.clubs using (((select auth.uid()) = user_id));

alter policy "Users can view own clubs" on public.clubs using (((select auth.uid()) = user_id));

alter policy "Users can view their own club" on public.clubs using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.clubs using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Coach access events are visible to their internal owner" on public.coach_access_events using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_access_events.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_access_events using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_agents_delete on public.coach_agents using (((select auth.uid()) = user_id));

alter policy coach_agents_delete_own on public.coach_agents using (((select auth.uid()) = user_id));

alter policy coach_agents_insert on public.coach_agents with check (((select auth.uid()) = user_id));

alter policy coach_agents_insert_own on public.coach_agents with check (((select auth.uid()) = user_id));

alter policy coach_agents_select on public.coach_agents using (((select auth.uid()) = user_id));

alter policy coach_agents_select_own on public.coach_agents using (((select auth.uid()) = user_id));

alter policy coach_agents_update on public.coach_agents using (((select auth.uid()) = user_id));

alter policy coach_agents_update_own on public.coach_agents using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.coach_agents using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_background_checks_delete on public.coach_background_checks using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_background_checks.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_background_checks_insert on public.coach_background_checks with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_background_checks.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_background_checks_select on public.coach_background_checks using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_background_checks.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_background_checks_update on public.coach_background_checks using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_background_checks.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_background_checks.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_background_checks using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_data_profiles_delete on public.coach_data_profiles using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_data_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_data_profiles_insert on public.coach_data_profiles with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_data_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_data_profiles_select on public.coach_data_profiles using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_data_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_data_profiles_update on public.coach_data_profiles using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_data_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_data_profiles using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage own coach derived metrics via coach" on public.coach_derived_metrics using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_derived_metrics.coach_id) AND (coach.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_derived_metrics.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_derived_metrics using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own coach development signals" on public.coach_development_signals using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_development_signals.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can insert own coach development signals" on public.coach_development_signals with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_development_signals.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own coach development signals" on public.coach_development_signals using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_development_signals.coach_id) AND (c.user_id = (select auth.uid()))))))) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_development_signals.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own coach development signals" on public.coach_development_signals using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_development_signals.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy investor_internal_data_fence on public.coach_development_signals using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach due diligence for own coaches" on public.coach_due_diligence_items using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_due_diligence_items.coach_id) AND (coach.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_due_diligence_items.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_due_diligence_items using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create coach duplicate reviews" on public.coach_duplicate_reviews with check (((created_by = (select auth.uid())) AND (reviewed_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy "Internal members can update coach duplicate reviews" on public.coach_duplicate_reviews using (is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])) with check (((reviewed_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.coach_duplicate_reviews using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_external_profiles_delete on public.coach_external_profiles using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_external_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_external_profiles_insert on public.coach_external_profiles with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_external_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_external_profiles_select on public.coach_external_profiles using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_external_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_external_profiles_update on public.coach_external_profiles using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_external_profiles.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_external_profiles using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Coach invitations are visible to their internal owner" on public.coach_invitations using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_invitations.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_invitations using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach media events for own coaches" on public.coach_media_events using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_media_events.coach_id) AND (coach.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_media_events.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_media_events using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own coach portal profiles" on public.coach_portal_profiles using (((select auth.uid()) = user_id));

alter policy "Users can insert own coach portal profiles" on public.coach_portal_profiles with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_portal_profiles.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own coach portal profiles" on public.coach_portal_profiles using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_portal_profiles.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own coach portal profiles" on public.coach_portal_profiles using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.coach_portal_profiles using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own coach portal staff" on public.coach_portal_staff_members using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_portal_staff_members.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy "Users can insert own coach portal staff" on public.coach_portal_staff_members with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_portal_staff_members.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy "Users can update own coach portal staff" on public.coach_portal_staff_members using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_portal_staff_members.coach_id) AND (coach.user_id = (select auth.uid()))))))) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_portal_staff_members.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy "Users can view own coach portal staff" on public.coach_portal_staff_members using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_portal_staff_members.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy investor_internal_data_fence on public.coach_portal_staff_members using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own coach private materials" on public.coach_private_materials using (((select auth.uid()) = user_id));

alter policy "Users can insert own coach private materials" on public.coach_private_materials with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_private_materials.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own coach private materials" on public.coach_private_materials using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_private_materials.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own coach private materials" on public.coach_private_materials using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.coach_private_materials using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach recruitment history for own coaches" on public.coach_recruitment_history using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_recruitment_history.coach_id) AND (coach.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_recruitment_history.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_recruitment_history using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_references_delete on public.coach_references using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_references.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_references_insert on public.coach_references with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_references.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_references_select on public.coach_references using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_references.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_references_update on public.coach_references using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_references.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_references.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_references using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal operators create research questions" on public.coach_research_questions with check ((is_internal_corpus_operator() AND (created_by = (select auth.uid())) AND (updated_by = (select auth.uid()))));

alter policy "Internal operators update research questions" on public.coach_research_questions using (is_internal_corpus_operator()) with check ((is_internal_corpus_operator() AND (updated_by = (select auth.uid()))));

alter policy "Users can manage coach scores for own coaches" on public.coach_scores using ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_scores.coach_id) AND (coach.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_scores.coach_id) AND (coach.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_scores using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach similarity for own coaches" on public.coach_similarity using (((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_similarity.coach_a_id) AND (coach.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_similarity.coach_b_id) AND (coach.user_id = (select auth.uid()))))))) with check (((EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_similarity.coach_a_id) AND (coach.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = coach_similarity.coach_b_id) AND (coach.user_id = (select auth.uid())))))));

alter policy investor_internal_data_fence on public.coach_similarity using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage group_members for own coach groups" on public.coach_staff_group_members using ((EXISTS ( SELECT 1
   FROM (coach_staff_groups g
     JOIN coaches c ON (((c.id = g.coach_id) AND (c.user_id = (select auth.uid())))))
  WHERE (g.id = coach_staff_group_members.group_id)))) with check ((EXISTS ( SELECT 1
   FROM (coach_staff_groups g
     JOIN coaches c ON (((c.id = g.coach_id) AND (c.user_id = (select auth.uid())))))
  WHERE (g.id = coach_staff_group_members.group_id))));

alter policy investor_internal_data_fence on public.coach_staff_group_members using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach_staff_groups for own coaches" on public.coach_staff_groups using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_staff_groups.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_staff_groups.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_staff_groups using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach_staff_history for own coaches" on public.coach_staff_history using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_staff_history.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_staff_history.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_staff_history using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage coach_stints for own coaches" on public.coach_stints using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_stints.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_stints.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_stints using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_tactical_reports_delete on public.coach_tactical_reports using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_tactical_reports.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_tactical_reports_insert on public.coach_tactical_reports with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_tactical_reports.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_tactical_reports_select on public.coach_tactical_reports using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_tactical_reports.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_tactical_reports_update on public.coach_tactical_reports using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_tactical_reports.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_tactical_reports.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_tactical_reports using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy coach_updates_delete on public.coach_updates using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_delete_own on public.coach_updates using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_insert on public.coach_updates with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_insert_own on public.coach_updates with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_select on public.coach_updates using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_select_own on public.coach_updates using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_update on public.coach_updates using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy coach_updates_update_own on public.coach_updates using ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = coach_updates.coach_id) AND (c.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.coach_updates using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own coaches" on public.coaches using (((select auth.uid()) = user_id));

alter policy "Users can insert own coaches" on public.coaches with check (((select auth.uid()) = user_id));

alter policy "Users can update own coaches" on public.coaches using (((select auth.uid()) = user_id));

alter policy "Users can view own coaches" on public.coaches using (((select auth.uid()) = user_id));

alter policy coaches_delete_own on public.coaches using ((user_id = (select auth.uid())));

alter policy coaches_insert_own on public.coaches with check ((user_id = (select auth.uid())));

alter policy coaches_select_own on public.coaches using ((user_id = (select auth.uid())));

alter policy coaches_update_own on public.coaches using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.coaches using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.confidential_access_grant_materials using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.confidential_access_grants using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own confidential access requests" on public.confidential_access_requests using (((select auth.uid()) = user_id));

alter policy "Users can insert own confidential access requests" on public.confidential_access_requests with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = confidential_access_requests.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = confidential_access_requests.coach_id) AND (c.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM mandate_shortlist ms
  WHERE ((ms.mandate_id = confidential_access_requests.mandate_id) AND (ms.coach_id = confidential_access_requests.coach_id))))));

alter policy "Users can update own confidential access requests" on public.confidential_access_requests using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = confidential_access_requests.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = confidential_access_requests.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own confidential access requests" on public.confidential_access_requests using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.confidential_access_requests using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_availability_statuses_delete on public.config_availability_statuses using (((select auth.uid()) = user_id));

alter policy config_availability_statuses_insert on public.config_availability_statuses with check (((select auth.uid()) = user_id));

alter policy config_availability_statuses_select on public.config_availability_statuses using (((select auth.uid()) = user_id));

alter policy config_availability_statuses_update on public.config_availability_statuses using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_availability_statuses using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_build_preferences_delete on public.config_build_preferences using (((select auth.uid()) = user_id));

alter policy config_build_preferences_insert on public.config_build_preferences with check (((select auth.uid()) = user_id));

alter policy config_build_preferences_select on public.config_build_preferences using (((select auth.uid()) = user_id));

alter policy config_build_preferences_update on public.config_build_preferences using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_build_preferences using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_formation_presets_delete on public.config_formation_presets using (((select auth.uid()) = user_id));

alter policy config_formation_presets_insert on public.config_formation_presets with check (((select auth.uid()) = user_id));

alter policy config_formation_presets_select on public.config_formation_presets using (((select auth.uid()) = user_id));

alter policy config_formation_presets_update on public.config_formation_presets using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_formation_presets using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own config lists" on public.config_lists using ((user_id = (select auth.uid())));

alter policy "Users can insert own config lists" on public.config_lists with check ((user_id = (select auth.uid())));

alter policy "Users can update own config lists" on public.config_lists using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy "Users can view own config lists" on public.config_lists using ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.config_lists using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_mandate_preference_categories_delete on public.config_mandate_preference_categories using (((select auth.uid()) = user_id));

alter policy config_mandate_preference_categories_insert on public.config_mandate_preference_categories with check (((select auth.uid()) = user_id));

alter policy config_mandate_preference_categories_select on public.config_mandate_preference_categories using (((select auth.uid()) = user_id));

alter policy config_mandate_preference_categories_update on public.config_mandate_preference_categories using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_mandate_preference_categories using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_pipeline_stages_delete on public.config_pipeline_stages using (((select auth.uid()) = user_id));

alter policy config_pipeline_stages_insert on public.config_pipeline_stages with check (((select auth.uid()) = user_id));

alter policy config_pipeline_stages_select on public.config_pipeline_stages using (((select auth.uid()) = user_id));

alter policy config_pipeline_stages_update on public.config_pipeline_stages using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_pipeline_stages using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_preferred_styles_delete on public.config_preferred_styles using (((select auth.uid()) = user_id));

alter policy config_preferred_styles_insert on public.config_preferred_styles with check (((select auth.uid()) = user_id));

alter policy config_preferred_styles_select on public.config_preferred_styles using (((select auth.uid()) = user_id));

alter policy config_preferred_styles_update on public.config_preferred_styles using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_preferred_styles using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_pressing_intensity_delete on public.config_pressing_intensity using (((select auth.uid()) = user_id));

alter policy config_pressing_intensity_insert on public.config_pressing_intensity with check (((select auth.uid()) = user_id));

alter policy config_pressing_intensity_select on public.config_pressing_intensity using (((select auth.uid()) = user_id));

alter policy config_pressing_intensity_update on public.config_pressing_intensity using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_pressing_intensity using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_reputation_tiers_delete on public.config_reputation_tiers using (((select auth.uid()) = user_id));

alter policy config_reputation_tiers_insert on public.config_reputation_tiers with check (((select auth.uid()) = user_id));

alter policy config_reputation_tiers_select on public.config_reputation_tiers using (((select auth.uid()) = user_id));

alter policy config_reputation_tiers_update on public.config_reputation_tiers using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_reputation_tiers using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy config_scoring_weights_delete on public.config_scoring_weights using (((select auth.uid()) = user_id));

alter policy config_scoring_weights_insert on public.config_scoring_weights with check (((select auth.uid()) = user_id));

alter policy config_scoring_weights_select on public.config_scoring_weights using (((select auth.uid()) = user_id));

alter policy config_scoring_weights_update on public.config_scoring_weights using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.config_scoring_weights using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create contact_coach_relationships" on public.contact_coach_relationships with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.contact_coach_relationships using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can insert own demo_seeds" on public.demo_seeds with check (((select auth.uid()) = user_id));

alter policy "Users can select own demo_seeds" on public.demo_seeds using (((select auth.uid()) = user_id));

alter policy "Users can update own demo seed" on public.demo_seeds using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy "Users can update own demo_seeds" on public.demo_seeds using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy "Users can upsert own demo seed" on public.demo_seeds with check (((select auth.uid()) = user_id));

alter policy "Users can view own demo seed" on public.demo_seeds using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.demo_seeds using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.dossier_access_events using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.dossier_offer_commercials using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Seller can manage dossier offers" on public.dossier_offers using (is_organization_member(seller_organization_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])) with check (((created_by = (select auth.uid())) AND is_organization_member(seller_organization_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.dossier_offers using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.dossier_order_commercials using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.dossier_orders using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage own evidence items" on public.evidence_items using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.evidence_items using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "External identities are visible to self and internal operators" on public.external_identity_profiles using (((user_id = (select auth.uid())) OR is_internal_operator()));

alter policy investor_internal_data_fence on public.external_identity_profiles using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create football_contacts" on public.football_contacts with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.football_contacts using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy integration_sync_state_delete on public.integration_sync_state using (((select auth.uid()) = user_id));

alter policy integration_sync_state_insert on public.integration_sync_state with check (((select auth.uid()) = user_id));

alter policy integration_sync_state_select on public.integration_sync_state using (((select auth.uid()) = user_id));

alter policy integration_sync_state_update on public.integration_sync_state using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.integration_sync_state using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.intelligence_audit_tombstones using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own intelligence inbox items" on public.intelligence_inbox_items using (((select auth.uid()) = user_id));

alter policy "Users can insert own intelligence inbox items" on public.intelligence_inbox_items with check ((((select auth.uid()) = user_id) AND ((coach_id IS NULL) OR (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = intelligence_inbox_items.coach_id) AND (c.user_id = (select auth.uid())))))) AND ((club_id IS NULL) OR (EXISTS ( SELECT 1
   FROM clubs c
  WHERE ((c.id = intelligence_inbox_items.club_id) AND (c.user_id = (select auth.uid())))))) AND ((mandate_id IS NULL) OR (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = intelligence_inbox_items.mandate_id) AND (m.user_id = (select auth.uid())))))) AND ((agent_id IS NULL) OR (EXISTS ( SELECT 1
   FROM agents a
  WHERE ((a.id = intelligence_inbox_items.agent_id) AND (a.user_id = (select auth.uid()))))))));

alter policy "Users can update own intelligence inbox items" on public.intelligence_inbox_items using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND ((coach_id IS NULL) OR (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = intelligence_inbox_items.coach_id) AND (c.user_id = (select auth.uid())))))) AND ((club_id IS NULL) OR (EXISTS ( SELECT 1
   FROM clubs c
  WHERE ((c.id = intelligence_inbox_items.club_id) AND (c.user_id = (select auth.uid())))))) AND ((mandate_id IS NULL) OR (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = intelligence_inbox_items.mandate_id) AND (m.user_id = (select auth.uid())))))) AND ((agent_id IS NULL) OR (EXISTS ( SELECT 1
   FROM agents a
  WHERE ((a.id = intelligence_inbox_items.agent_id) AND (a.user_id = (select auth.uid()))))))));

alter policy "Users can view own intelligence inbox items" on public.intelligence_inbox_items using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.intelligence_inbox_items using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage own intelligence_items" on public.intelligence_items using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.intelligence_items using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create intelligence_sessions" on public.intelligence_sessions with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.intelligence_sessions using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_read_own_access on public.investor_access using ((user_id = (select auth.uid())));

alter policy investor_insert_own_workspace on public.investor_workspaces with check (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM investor_access a
  WHERE ((a.user_id = (select auth.uid())) AND (a.revoked_at IS NULL) AND (a.expires_at > now()))))));

alter policy investor_read_own_workspace on public.investor_workspaces using (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM investor_access a
  WHERE ((a.user_id = (select auth.uid())) AND (a.revoked_at IS NULL) AND (a.expires_at > now()))))));

alter policy investor_update_own_workspace on public.investor_workspaces using (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM investor_access a
  WHERE ((a.user_id = (select auth.uid())) AND (a.revoked_at IS NULL) AND (a.expires_at > now())))))) with check (((user_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM investor_access a
  WHERE ((a.user_id = (select auth.uid())) AND (a.revoked_at IS NULL) AND (a.expires_at > now()))))));

alter policy "Users can delete own mandate candidate suggestions" on public.mandate_candidate_suggestions using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_candidate_suggestions.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = mandate_candidate_suggestions.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can insert own mandate candidate suggestions" on public.mandate_candidate_suggestions with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_candidate_suggestions.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = mandate_candidate_suggestions.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own mandate candidate suggestions" on public.mandate_candidate_suggestions using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_candidate_suggestions.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = mandate_candidate_suggestions.coach_id) AND (c.user_id = (select auth.uid()))))))) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_candidate_suggestions.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = mandate_candidate_suggestions.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own mandate candidate suggestions" on public.mandate_candidate_suggestions using ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_candidate_suggestions.mandate_id) AND (m.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches c
  WHERE ((c.id = mandate_candidate_suggestions.coach_id) AND (c.user_id = (select auth.uid())))))));

alter policy investor_internal_data_fence on public.mandate_candidate_suggestions using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete deliverables for own mandates" on public.mandate_deliverables using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_deliverables.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can insert deliverables for own mandates" on public.mandate_deliverables with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_deliverables.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can update deliverables for own mandates" on public.mandate_deliverables using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_deliverables.mandate_id) AND (m.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_deliverables.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can view deliverables for own mandates" on public.mandate_deliverables using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_deliverables.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.mandate_deliverables using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage longlist for own mandates" on public.mandate_longlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_longlist.mandate_id) AND (m.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_longlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.mandate_longlist using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete shortlist for own mandates" on public.mandate_shortlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can insert shortlist for own mandates" on public.mandate_shortlist with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can update shortlist for own mandates" on public.mandate_shortlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can view shortlist for own mandates" on public.mandate_shortlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.mandate_shortlist using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy mandate_shortlist_delete_own on public.mandate_shortlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy mandate_shortlist_insert_own on public.mandate_shortlist with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy mandate_shortlist_select_own on public.mandate_shortlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy mandate_shortlist_update_own on public.mandate_shortlist using ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = mandate_shortlist.mandate_id) AND (m.user_id = (select auth.uid()))))));

alter policy "Users can delete own mandates" on public.mandates using (((select auth.uid()) = user_id));

alter policy "Users can insert own mandates" on public.mandates with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM clubs c
  WHERE ((c.id = mandates.club_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can update own mandates" on public.mandates using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM clubs c
  WHERE ((c.id = mandates.club_id) AND (c.user_id = (select auth.uid())))))));

alter policy "Users can view own mandates" on public.mandates using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.mandates using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy mandates_delete_own on public.mandates using ((user_id = (select auth.uid())));

alter policy mandates_insert_own on public.mandates with check ((user_id = (select auth.uid())));

alter policy mandates_select_own on public.mandates using ((user_id = (select auth.uid())));

alter policy mandates_update_own on public.mandates using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy "Users can delete matches for their vacancies" on public.matches using (((EXISTS ( SELECT 1
   FROM (vacancies v
     JOIN clubs c ON ((c.id = v.club_id)))
  WHERE ((v.id = matches.vacancy_id) AND (c.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = matches.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy "Users can insert matches for their vacancies" on public.matches with check (((EXISTS ( SELECT 1
   FROM (vacancies v
     JOIN clubs c ON ((c.id = v.club_id)))
  WHERE ((v.id = matches.vacancy_id) AND (c.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = matches.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy "Users can update matches for their vacancies" on public.matches using (((EXISTS ( SELECT 1
   FROM (vacancies v
     JOIN clubs c ON ((c.id = v.club_id)))
  WHERE ((v.id = matches.vacancy_id) AND (c.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = matches.coach_id) AND (coach.user_id = (select auth.uid()))))))) with check (((EXISTS ( SELECT 1
   FROM (vacancies v
     JOIN clubs c ON ((c.id = v.club_id)))
  WHERE ((v.id = matches.vacancy_id) AND (c.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = matches.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy "Users can view matches for their vacancies" on public.matches using (((EXISTS ( SELECT 1
   FROM (vacancies v
     JOIN clubs c ON ((c.id = v.club_id)))
  WHERE ((v.id = matches.vacancy_id) AND (c.user_id = (select auth.uid()))))) AND (EXISTS ( SELECT 1
   FROM coaches coach
  WHERE ((coach.id = matches.coach_id) AND (coach.user_id = (select auth.uid())))))));

alter policy investor_internal_data_fence on public.matches using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.organization_access_events using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Members and internal operators can view memberships" on public.organization_memberships using (((user_id = (select auth.uid())) OR is_organization_member(organization_id, ARRAY['owner'::text, 'admin'::text, 'club_owner'::text, 'club_director'::text]) OR is_internal_operator()));

alter policy "Organization owners can add memberships" on public.organization_memberships with check ((is_organization_member(organization_id, ARRAY['owner'::text, 'admin'::text]) OR (EXISTS ( SELECT 1
   FROM organizations organization
  WHERE ((organization.id = organization_memberships.organization_id) AND (organization.created_by = (select auth.uid())))))));

alter policy investor_internal_data_fence on public.organization_memberships using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal operators can create organizations" on public.organizations with check (((created_by = (select auth.uid())) AND is_internal_operator()));

alter policy "Members and internal operators can view organizations" on public.organizations using (((created_by = (select auth.uid())) OR is_organization_member(id) OR is_internal_operator()));

alter policy "Organization owners can update organizations" on public.organizations using (((created_by = (select auth.uid())) OR is_organization_member(id, ARRAY['owner'::text, 'admin'::text]))) with check (((created_by = (select auth.uid())) OR is_organization_member(id, ARRAY['owner'::text, 'admin'::text])));

alter policy investor_internal_data_fence on public.organizations using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create profile claims" on public.profile_claims with check (((user_id = (select auth.uid())) AND (((created_by = (select auth.uid())) AND (org_id IS NOT NULL) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])) OR ((created_by IS NULL) AND (org_id IS NULL) AND is_internal_operator(ARRAY['owner'::text, 'admin'::text, 'analyst'::text])))));

alter policy "Internal members can delete profile claims" on public.profile_claims using ((((org_id IS NOT NULL) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])) OR ((org_id IS NULL) AND (user_id = (select auth.uid())) AND is_internal_operator(ARRAY['owner'::text, 'admin'::text, 'analyst'::text]))));

alter policy "Internal members can update profile claims" on public.profile_claims using ((((org_id IS NOT NULL) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])) OR ((org_id IS NULL) AND (user_id = (select auth.uid())) AND is_internal_operator(ARRAY['owner'::text, 'admin'::text, 'analyst'::text])))) with check ((is_internal_operator(ARRAY['owner'::text, 'admin'::text, 'analyst'::text]) AND ((org_id IS NULL) OR is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text]))));

alter policy "Internal members can view profile claims" on public.profile_claims using ((((org_id IS NOT NULL) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])) OR ((org_id IS NULL) AND (user_id = (select auth.uid())) AND is_internal_operator(ARRAY['owner'::text, 'admin'::text, 'analyst'::text]))));

alter policy investor_internal_data_fence on public.profile_claims using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create reference_campaign_contacts" on public.reference_campaign_contacts with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.reference_campaign_contacts using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create reference_campaigns" on public.reference_campaigns with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.reference_campaigns using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy investor_internal_data_fence on public.scoring_models using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own scoring weights" on public.scoring_weights using ((user_id = (select auth.uid())));

alter policy "Users can insert own scoring weights" on public.scoring_weights with check ((user_id = (select auth.uid())));

alter policy "Users can update own scoring weights" on public.scoring_weights using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy "Users can view own scoring weights" on public.scoring_weights using ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.scoring_weights using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own staff" on public.staff using (((select auth.uid()) = user_id));

alter policy "Users can insert own staff" on public.staff with check (((select auth.uid()) = user_id));

alter policy "Users can update own staff" on public.staff using (((select auth.uid()) = user_id));

alter policy "Users can view own staff" on public.staff using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.staff using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can delete own succession plans" on public.succession_plans using (((select auth.uid()) = user_id));

alter policy "Users can insert own succession plans" on public.succession_plans with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM clubs c
  WHERE ((c.id = succession_plans.club_id) AND (c.user_id = (select auth.uid()))))) AND ((linked_mandate_id IS NULL) OR (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = succession_plans.linked_mandate_id) AND (m.user_id = (select auth.uid()))))))));

alter policy "Users can update own succession plans" on public.succession_plans using (((select auth.uid()) = user_id)) with check ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM clubs c
  WHERE ((c.id = succession_plans.club_id) AND (c.user_id = (select auth.uid()))))) AND ((linked_mandate_id IS NULL) OR (EXISTS ( SELECT 1
   FROM mandates m
  WHERE ((m.id = succession_plans.linked_mandate_id) AND (m.user_id = (select auth.uid()))))))));

alter policy "Users can view own succession plans" on public.succession_plans using (((select auth.uid()) = user_id));

alter policy investor_internal_data_fence on public.succession_plans using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Internal members can create trusted_bench_entries" on public.trusted_bench_entries with check (((created_by = (select auth.uid())) AND is_organization_member(org_id, ARRAY['owner'::text, 'admin'::text, 'analyst'::text])));

alter policy investor_internal_data_fence on public.trusted_bench_entries using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can insert vacancies for their clubs" on public.vacancies with check ((club_id IN ( SELECT clubs.id
   FROM clubs
  WHERE (clubs.user_id = (select auth.uid())))));

alter policy "Users can update vacancies for their clubs" on public.vacancies using ((club_id IN ( SELECT clubs.id
   FROM clubs
  WHERE (clubs.user_id = (select auth.uid())))));

alter policy "Users can view vacancies for their clubs" on public.vacancies using ((club_id IN ( SELECT clubs.id
   FROM clubs
  WHERE (clubs.user_id = (select auth.uid())))));

alter policy investor_internal_data_fence on public.vacancies using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

alter policy "Users can manage own watchlist" on public.watchlist_coaches using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));

alter policy investor_internal_data_fence on public.watchlist_coaches using ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid())))))) with check ((NOT (EXISTS ( SELECT 1
   FROM investor_access
  WHERE (investor_access.user_id = (select auth.uid()))))));

commit;
