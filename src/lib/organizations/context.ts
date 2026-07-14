import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  classifyOrganizationAccess,
  type OrganizationAccessProfile,
} from './access'

export type OrganizationContext = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  organizationType: string
  clubId: string | null
  membershipRole: string
  userId: string
}

export async function getClubPortalContext(): Promise<OrganizationContext | null> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (!memberships?.length) return null
  const roleByOrganization = new Map(memberships.map((membership) => [membership.organization_id, membership.role]))
  const { data: organizations } = await supabase
    .from('organizations')
    .select('id, name, slug, organization_type, club_id')
    .in('id', memberships.map((membership) => membership.organization_id))
    .eq('organization_type', 'club')
    .eq('status', 'active')
    .order('name')
    .limit(1)

  const organization = organizations?.[0]
  if (!organization) return null
  return {
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    organizationType: organization.organization_type,
    clubId: organization.club_id,
    membershipRole: roleByOrganization.get(organization.id) ?? 'club_viewer',
    userId: user.id,
  }
}

export async function getInternalOrganizationId(userId: string): Promise<string | null> {
  const supabase = createServerSupabaseClient()
  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
  if (!memberships?.length) return null

  const { data: organizations } = await supabase
    .from('organizations')
    .select('id')
    .in('id', memberships.map((membership) => membership.organization_id))
    .eq('organization_type', 'internal')
    .eq('status', 'active')
    .limit(1)
  return organizations?.[0]?.id ?? null
}

export async function getOrganizationAccessProfile(
  userId: string
): Promise<OrganizationAccessProfile> {
  const { data: memberships } = await createServerSupabaseClient()
    .from('organization_memberships')
    .select('role, status')
    .eq('user_id', userId)

  return classifyOrganizationAccess(memberships)
}
