import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { copySessionCookies, loginPathFor } from './session-cookies'
import { demoBlocksIntegration } from '@/lib/demo-safety.mjs'
import {
  canEnterAnalystApplication,
  classifyOrganizationAccess,
  isAnalystApiRoute,
  isAnalystRoute,
  isPublicApplicationPath,
  resolveWorkspaceHome,
  NO_WORKSPACE_PATH,
} from '@/lib/organizations/access'

export async function updateSession(request: NextRequest) {
  if (demoBlocksIntegration(request.nextUrl.pathname, process.env.DEMO_MODE)) {
    return NextResponse.json({ error: 'Live integrations are disabled in the investor demo. Use the prepared sample data.' }, { status: 403 })
  }
  // Forward pathname to server components via request header
  request.headers.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          // Refresh tokens can span several cookies. Rebuilding the response for
          // each chunk loses earlier chunks and breaks the next navigation.
          const previousCookies = response.cookies.getAll()
          cookies.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          previousCookies.forEach((cookie) => response.cookies.set(cookie))
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          response.headers.set('Cache-Control', 'private, no-store')
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  function redirectWithSession(url: URL) {
    const redirect = NextResponse.redirect(url)
    copySessionCookies(response.cookies, redirect.cookies)
    redirect.headers.set('Cache-Control', 'private, no-store')
    return redirect
  }

  const pathname = request.nextUrl.pathname
  const isClubInvite = pathname.startsWith('/club/invite/')
  const isCoachInvite = pathname.startsWith('/coach/invite/')
  const isPublicPath = isPublicApplicationPath(pathname)

  // Protected routes - redirect to the correct login if not authenticated.
  if (
    !user &&
    !isPublicPath
  ) {
    const url = request.nextUrl.clone()
    url.pathname = loginPathFor(pathname)
    return redirectWithSession(url)
  }

  if (!user) return response

  // Read grants from the database on every request, not user-editable metadata
  // or a stale JWT. Even expired investors remain outside the staff application.
  const { data: investorGrant } = await supabase.from('investor_access')
    .select('user_id').eq('user_id', user.id).maybeSingle()
  if (investorGrant) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Internal APIs are unavailable to evaluation accounts.' }, { status: 403 })
    }
    if (pathname === '/investor' || pathname.startsWith('/investor/') || pathname.startsWith('/auth/')) {
      response.headers.set('Cache-Control', 'private, no-store')
      return response
    }
    const url = request.nextUrl.clone()
    url.pathname = '/investor'
    url.search = ''
    return redirectWithSession(url)
  }

  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('organization_id, role, status')
    .eq('user_id', user.id)
  const access = classifyOrganizationAccess(memberships)
  const activeClubOrganizationId = memberships?.find(
    (membership) =>
      membership.status === 'active' &&
      ['club_owner', 'club_director', 'club_viewer'].includes(membership.role)
  )?.organization_id
  const activeCoachOrganizationId = memberships?.find(
    (membership) =>
      membership.status === 'active' &&
      ['coach', 'coach_representative'].includes(membership.role)
  )?.organization_id

  let hasCompletedExternalOnboarding = true
  const externalOrganizationId = access.isClubOnlyIdentity
    ? activeClubOrganizationId
    : access.isCoachOnlyIdentity
      ? activeCoachOrganizationId
      : null
  if (externalOrganizationId) {
    const { data: identity } = await supabase
      .from('external_identity_profiles')
      .select('id')
      .eq('organization_id', externalOrganizationId)
      .eq('user_id', user.id)
      .not('onboarding_completed_at', 'is', null)
      .maybeSingle()
    hasCompletedExternalOnboarding = Boolean(identity)
  }

  if (access.isClubOnlyIdentity && isAnalystApiRoute(pathname)) {
    return NextResponse.json({ error: 'Analyst API access is not available to club accounts.' }, { status: 403 })
  }
  if (access.isCoachOnlyIdentity && isAnalystApiRoute(pathname)) {
    return NextResponse.json({ error: 'Analyst API access is not available to coach accounts.' }, { status: 403 })
  }

  // Analyst surfaces are entered on active internal membership only. An account
  // that holds no organization identity at all must be denied here: it is not a
  // club identity and not a coach identity, so the checks above would otherwise
  // admit it to the whole internal application.
  if (!canEnterAnalystApplication(access) && isAnalystApiRoute(pathname)) {
    return NextResponse.json(
      { error: 'Analyst API access requires an active internal membership.' },
      { status: 403 }
    )
  }

  // Club identities never enter the analyst application, including after
  // membership revocation. The club layout then renders the inactive state.
  if (access.isClubOnlyIdentity && isAnalystRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/club'
    url.search = ''
    return redirectWithSession(url)
  }
  if (access.isCoachOnlyIdentity && isAnalystRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/coach/profile'
    url.search = ''
    return redirectWithSession(url)
  }
  if (!canEnterAnalystApplication(access) && isAnalystRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = resolveWorkspaceHome(access)
    url.search = ''
    return redirectWithSession(url)
  }

  // An account without any workspace has exactly one reachable destination.
  // Public paths are left alone so that sign-out and the auth callback still
  // complete rather than bouncing off this guard.
  if (
    access.hasNoWorkspaceIdentity &&
    !isPublicPath &&
    pathname !== NO_WORKSPACE_PATH
  ) {
    const url = request.nextUrl.clone()
    url.pathname = NO_WORKSPACE_PATH
    url.search = ''
    return redirectWithSession(url)
  }
  if (!access.hasNoWorkspaceIdentity && pathname === NO_WORKSPACE_PATH) {
    const url = request.nextUrl.clone()
    url.pathname = resolveWorkspaceHome(access)
    url.search = ''
    return redirectWithSession(url)
  }

  const isClubOnboarding = pathname === '/club/onboarding'
  const isCoachOnboarding = pathname === '/coach/onboarding'
  if (
    access.isClubOnlyIdentity &&
    access.hasActiveClubAccess &&
    !hasCompletedExternalOnboarding &&
    pathname.startsWith('/club') &&
    !isClubInvite &&
    pathname !== '/club/login' &&
    !isClubOnboarding
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/club/onboarding'
    url.search = ''
    return redirectWithSession(url)
  }
  if (
    access.isCoachOnlyIdentity &&
    access.hasActiveCoachAccess &&
    !hasCompletedExternalOnboarding &&
    pathname.startsWith('/coach') &&
    !isCoachInvite &&
    pathname !== '/coach/login' &&
    !isCoachOnboarding
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/coach/onboarding'
    url.search = ''
    return redirectWithSession(url)
  }
  if (
    access.isClubOnlyIdentity &&
    access.hasActiveClubAccess &&
    hasCompletedExternalOnboarding &&
    isClubOnboarding
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/club'
    url.search = ''
    return redirectWithSession(url)
  }
  if (
    access.isCoachOnlyIdentity &&
    access.hasActiveCoachAccess &&
    hasCompletedExternalOnboarding &&
    isCoachOnboarding
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/coach/profile'
    url.search = ''
    return redirectWithSession(url)
  }

  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = resolveWorkspaceHome(access)
    url.search = ''
    return redirectWithSession(url)
  }

  if (pathname === '/club/login') {
    const url = request.nextUrl.clone()
    url.pathname = access.hasActiveClubAccess ? '/club' : access.hasActiveInternalAccess ? '/dashboard' : '/club'
    url.search = ''
    return redirectWithSession(url)
  }

  if (pathname === '/coach/login') {
    const url = request.nextUrl.clone()
    url.pathname = access.hasActiveCoachAccess
      ? '/coach/profile'
      : access.hasActiveInternalAccess
        ? '/dashboard'
        : '/coach/profile'
    url.search = ''
    return redirectWithSession(url)
  }

  return response
}
