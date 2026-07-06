// Pure access rule for candidate assessment, kept free of server-only imports so
// it can be unit-tested with a stub client. Assessment runs on shortlisted
// candidates only: the caller must own the mandate and the coach must be on that
// mandate's shortlist.

interface AccessChain {
  eq(column: string, value: string): AccessChain
  maybeSingle(): Promise<{ data: unknown | null }>
}
interface AccessSelectable {
  select(columns: string): AccessChain
}
export interface AssessmentAccessClient {
  from(table: string): AccessSelectable
}

export async function canAssessCandidate(
  client: AssessmentAccessClient,
  userId: string,
  mandateId: string,
  coachId: string
): Promise<boolean> {
  if (!userId || !mandateId || !coachId) return false
  const [mandate, shortlisted] = await Promise.all([
    client.from('mandates').select('id').eq('id', mandateId).eq('user_id', userId).maybeSingle(),
    client
      .from('mandate_shortlist')
      .select('coach_id')
      .eq('mandate_id', mandateId)
      .eq('coach_id', coachId)
      .maybeSingle(),
  ])
  return Boolean(mandate.data && shortlisted.data)
}
