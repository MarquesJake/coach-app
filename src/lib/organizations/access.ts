export const INTERNAL_ORGANIZATION_ROLES = ['owner', 'admin', 'analyst'] as const
export const CLUB_ORGANIZATION_ROLES = ['club_owner', 'club_director', 'club_viewer'] as const
export const COACH_ORGANIZATION_ROLES = ['coach', 'coach_representative'] as const

export type OrganizationMembershipIdentity = {
  role: string
  status: string
}

export type OrganizationAccessProfile = {
  hasActiveInternalAccess: boolean
  hasActiveClubAccess: boolean
  hasActiveCoachAccess: boolean
  hasClubIdentity: boolean
  hasCoachIdentity: boolean
  isClubOnlyIdentity: boolean
  isCoachOnlyIdentity: boolean
}

export const ANALYST_ROUTE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/alerts',
  '/agents',
  '/clubs',
  '/coach-portal',
  '/coaches',
  '/compare',
  '/config',
  '/dossier-orders',
  '/intelligence',
  '/mandates',
  '/matches',
  '/network',
  '/settings',
  '/staff',
  '/succession',
  '/vacancies',
] as const

export function classifyOrganizationAccess(
  memberships: OrganizationMembershipIdentity[] | null | undefined
): OrganizationAccessProfile {
  const rows = memberships ?? []
  const hasActiveInternalAccess = rows.some(
    (membership) =>
      membership.status === 'active' &&
      (INTERNAL_ORGANIZATION_ROLES as readonly string[]).includes(membership.role)
  )
  const hasActiveClubAccess = rows.some(
    (membership) =>
      membership.status === 'active' &&
      (CLUB_ORGANIZATION_ROLES as readonly string[]).includes(membership.role)
  )
  const hasClubIdentity = rows.some((membership) =>
    (CLUB_ORGANIZATION_ROLES as readonly string[]).includes(membership.role)
  )
  const hasActiveCoachAccess = rows.some(
    (membership) =>
      membership.status === 'active' &&
      (COACH_ORGANIZATION_ROLES as readonly string[]).includes(membership.role)
  )
  const hasCoachIdentity = rows.some((membership) =>
    (COACH_ORGANIZATION_ROLES as readonly string[]).includes(membership.role)
  )

  return {
    hasActiveInternalAccess,
    hasActiveClubAccess,
    hasActiveCoachAccess,
    hasClubIdentity,
    hasCoachIdentity,
    isClubOnlyIdentity: hasClubIdentity && !hasActiveInternalAccess && !hasCoachIdentity,
    isCoachOnlyIdentity: hasCoachIdentity && !hasActiveInternalAccess && !hasClubIdentity,
  }
}

export function isAnalystRoute(pathname: string): boolean {
  return ANALYST_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isAnalystApiRoute(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/')
}
