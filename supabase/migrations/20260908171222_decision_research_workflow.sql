-- Research is internal working material. It never grants club/coach publication rights.
alter table public.mandates add column if not exists decision_brief jsonb not null default '{}'::jsonb;
alter table public.mandates add constraint mandates_decision_brief_object check (jsonb_typeof(decision_brief) = 'object' and octet_length(decision_brief::text) <= 60000);

create table public.coach_research_questions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.coaches(id) on delete restrict,
  mandate_id uuid references public.mandates(id) on delete restrict,
  domain text not null check (domain in ('Conditions for success','Football methods','Career context','Leadership under pressure','Working relationships','Appointment feasibility','Counterargument')),
  question text not null check (length(btrim(question)) between 8 and 2000),
  decision_impact text not null check (length(btrim(decision_impact)) between 1 and 4000),
  source_plan text not null default '' check (length(source_plan) <= 4000),
  owner text not null default '' check (length(owner) <= 200),
  due_on date,
  status text not null default 'open' check (status in ('open','in_progress','answered')),
  answer text not null default '' check (length(answer) <= 12000),
  counter_evidence text not null default '' check (length(counter_evidence) <= 8000),
  evidence_claim_ids uuid[] not null default '{}',
  version integer not null default 1,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  updated_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'answered' or (length(btrim(answer)) > 0 and cardinality(evidence_claim_ids) > 0)),
  check (cardinality(evidence_claim_ids) <= 30)
);
create index coach_research_questions_coach on public.coach_research_questions(coach_id, created_at desc);
create index coach_research_questions_mandate on public.coach_research_questions(mandate_id) where mandate_id is not null;
create index coach_research_questions_due on public.coach_research_questions(due_on) where status <> 'answered';
alter table public.coach_research_questions enable row level security;
revoke all on public.coach_research_questions from public, anon, authenticated;
grant select, insert, update on public.coach_research_questions to authenticated;
grant all on public.coach_research_questions to service_role;
create policy "Internal operators read research questions" on public.coach_research_questions for select to authenticated
  using (public.is_internal_corpus_operator());
create policy "Internal operators create research questions" on public.coach_research_questions for insert to authenticated
  with check (public.is_internal_corpus_operator() and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Internal operators update research questions" on public.coach_research_questions for update to authenticated
  using (public.is_internal_corpus_operator()) with check (public.is_internal_corpus_operator() and updated_by = (select auth.uid()));

create function private.validate_research_question() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.is_internal_corpus_operator() then raise exception 'Internal research access required'; end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.coach_id <> old.coach_id or new.created_by <> old.created_by or new.created_at <> old.created_at then
      raise exception 'Research identity cannot be changed';
    end if;
    new.version := old.version + 1;
  else
    new.version := 1;
    new.created_by := auth.uid();
    new.created_at := now();
  end if;
  if exists (select 1 from unnest(new.evidence_claim_ids) claim_id where not exists (
    select 1 from public.profile_claims c where c.id = claim_id and c.coach_id = new.coach_id
  )) then raise exception 'Every linked finding must belong to this coach and be accessible'; end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end $$;
revoke all on function private.validate_research_question() from public;
create trigger validate_research_question before insert or update on public.coach_research_questions
for each row execute function private.validate_research_question();

comment on table public.coach_research_questions is 'Internal decision questions and provisional answers. Answered is not independent corroboration or approval for external release.';
comment on column public.mandates.decision_brief is 'Structured internal appointment requirements, priorities and practical boundaries; original club-submitted wording and amendments remain separate.';
