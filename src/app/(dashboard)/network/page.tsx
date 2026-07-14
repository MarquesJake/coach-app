import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getInternalOrganizationId } from '@/lib/organizations/context'
import { NetworkDirectoryClient } from './_components/network-directory-client'

export default async function NetworkPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const organizationId = await getInternalOrganizationId(user.id)
  if (!organizationId) return <p className="text-sm text-destructive">Internal analyst access is required.</p>
  // Types are regenerated after the expand migration is applied.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: contacts }, { data: relationships }, { data: sessions }, { data: coaches }] = await Promise.all([
    db.from('football_contacts').select('*').eq('org_id', organizationId).order('full_name'),
    db.from('contact_coach_relationships').select('contact_id').eq('org_id', organizationId),
    db.from('intelligence_sessions').select('contact_id').eq('org_id', organizationId),
    supabase.from('coaches').select('id, name').eq('user_id', user.id).order('name'),
  ])
  const relationshipCounts = new Map<string, number>()
  for (const row of relationships ?? []) relationshipCounts.set(row.contact_id, (relationshipCounts.get(row.contact_id) ?? 0) + 1)
  const sessionCounts = new Map<string, number>()
  for (const row of sessions ?? []) if (row.contact_id) sessionCounts.set(row.contact_id, (sessionCounts.get(row.contact_id) ?? 0) + 1)
  return (
    <NetworkDirectoryClient
      contacts={(contacts ?? []).map((contact: Record<string, unknown>) => ({
        ...contact,
        relationship_count: relationshipCounts.get(String(contact.id)) ?? 0,
        session_count: sessionCounts.get(String(contact.id)) ?? 0,
      }))}
      coaches={coaches ?? []}
    />
  )
}
