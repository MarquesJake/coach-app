-- Mandate children are internal working material just like their parent.
-- Private coach submissions and controlled releases retain their own policies.
do $$
declare child_table text;
begin
  foreach child_table in array array['mandate_shortlist', 'mandate_longlist', 'mandate_deliverables'] loop
    execute format('drop policy if exists "Internal team can work the shared corpus" on public.%I', child_table);
    execute format(
      'create policy "Internal team can work the shared corpus" on public.%I '
      || 'for all to authenticated using (public.is_internal_corpus_operator()) '
      || 'with check (public.is_internal_corpus_operator())', child_table
    );
  end loop;
end;
$$;
