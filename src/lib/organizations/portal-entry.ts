export const PORTAL_ENTRIES = [
  { id: 'club', label: 'Club decision room', login: '/club/login', home: '/club', listed: true },
  { id: 'coach', label: 'Coach or representative', login: '/coach/login', home: '/coach/profile', listed: true },
  { id: 'internal', label: 'Internal team', login: '/login', home: '/dashboard', listed: true },
  // The investor door is reached only through its own link; it is never shown on public sign-in pages.
  { id: 'investor', label: 'Investor evaluation', login: '/investor/login', home: '/investor', listed: false },
] as const
export type PortalRole = typeof PORTAL_ENTRIES[number]['id']

/** Doors offered on the homepage, the internal sign-in page and account recovery. */
export const LISTED_PORTAL_ENTRIES = PORTAL_ENTRIES.filter(entry => entry.listed)

export function parsePortalRole(value: string | null | undefined): PortalRole | null {
  return PORTAL_ENTRIES.find(entry => entry.id === value)?.id ?? null
}

export function portalDestination(role: PortalRole, value?: string | null): string {
  const fallback = PORTAL_ENTRIES.find(entry => entry.id === role)!.home
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return fallback
  try {
    const url = new URL(value, 'https://gaffa.invalid')
    // Reject encoded separators and dot segments before testing the role boundary.
    if (url.origin !== 'https://gaffa.invalid' || url.pathname !== value.split(/[?#]/)[0] || /%|\\/.test(url.pathname)) return fallback
    const root = url.pathname.split('/')[1]
    const allowed = role === 'internal'
      ? ['dashboard', 'mandates', 'clubs', 'coaches', 'club-briefs', 'coach-portal', 'dossier-orders', 'intelligence', 'succession'].includes(root)
      : root === role
    if (!allowed || /\/(login|logout)(\/|$)/.test(url.pathname)) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch { return fallback }
}

export function portalLoginHref(role: PortalRole, next?: string | null) {
  const login = PORTAL_ENTRIES.find(entry => entry.id === role)!.login
  return next ? `${login}?${new URLSearchParams({ next: portalDestination(role, next) })}` : login
}

export function portalRecoveryHref(role: PortalRole, next?: string | null) {
  return `/auth/recover?${new URLSearchParams({ portal: role, next: portalDestination(role, next) })}`
}

export function passwordUpdateHref(role: PortalRole, next?: string | null) {
  return `/auth/update-password?${new URLSearchParams({ portal: role, next: portalDestination(role, next) })}`
}

export function isPortalInvitation(role: PortalRole | null, next: string | null | undefined): boolean {
  if (role !== 'club' && role !== 'coach') return false
  return new RegExp(`^/${role}/invite/[0-9a-f]{64}$`).test(portalDestination(role, next).split(/[?#]/)[0])
}

/** Query parameters select a destination, never a membership or an investor grant. */
export function authenticatedPortalDestination(
  role: PortalRole | null,
  next: string | null | undefined,
  access: OrganizationAccessProfile,
  hasInvestorIdentity: boolean,
): string {
  // Expired/revoked investors also stay in the evaluation area, whose server page checks expiry.
  if (hasInvestorIdentity) return portalDestination('investor', role === 'investor' ? next : null)
  if (role && isPortalInvitation(role, next)) return portalDestination(role, next)
  if (role && (
    (role === 'club' && access.hasActiveClubAccess) ||
    (role === 'coach' && access.hasActiveCoachAccess) ||
    (role === 'internal' && access.hasActiveInternalAccess)
  )) return portalDestination(role, next)
  return resolveWorkspaceHome(access)
}
import { resolveWorkspaceHome, type OrganizationAccessProfile } from './access.ts'
