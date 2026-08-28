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
  /**
   * The account carries no organization identity of any kind. Such an account
   * must never fall through into the internal analyst application: analyst
   * access is granted by active internal membership, never by the absence of
   * a club or coach identity.
   */
  hasNoWorkspaceIdentity: boolean
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

export const NON_ANALYST_API_ROUTE_PREFIXES = [
  '/api/private-materials',
] as const

export function isPublicApplicationPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/api/health' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/club/login') ||
    pathname.startsWith('/coach/login') ||
    pathname.startsWith('/club/invite/') ||
    pathname.startsWith('/coach/invite/') ||
    pathname.startsWith('/auth')
  )
}

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
    hasNoWorkspaceIdentity:
      !hasActiveInternalAccess && !hasClubIdentity && !hasCoachIdentity,
  }
}

/**
 * The single authority for entering the internal analyst application. Analyst
 * surfaces are permitted only on active internal membership, so an account with
 * no membership at all is denied rather than admitted by default.
 */
export function canEnterAnalystApplication(
  access: OrganizationAccessProfile
): boolean {
  return access.hasActiveInternalAccess
}

/** Where an authenticated account belongs when it cannot enter analyst surfaces. */
export function resolveWorkspaceHome(access: OrganizationAccessProfile): string {
  if (access.hasActiveInternalAccess) return '/dashboard/overview'
  if (access.hasClubIdentity) return '/club'
  if (access.hasCoachIdentity) return '/coach/profile'
  return NO_WORKSPACE_PATH
}

export const NO_WORKSPACE_PATH = '/no-access'

export function isAnalystRoute(pathname: string): boolean {
  return ANALYST_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isAnalystApiRoute(pathname: string): boolean {
  if (
    NON_ANALYST_API_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return false
  }
  return !isPublicApplicationPath(pathname) && (pathname === '/api' || pathname.startsWith('/api/'))
}
