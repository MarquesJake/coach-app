import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  classifyOrganizationAccess,
  isAnalystApiRoute,
  isAnalystRoute,
} from '@/lib/organizations/access'

export async function updateSession(request: NextRequest) {
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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isClubInvite = pathname.startsWith('/club/invite/')
  const isCoachInvite = pathname.startsWith('/coach/invite/')
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/club/login') ||
    pathname.startsWith('/coach/login') ||
    isClubInvite ||
    isCoachInvite ||
    pathname.startsWith('/auth')

  // Protected routes - redirect to the correct login if not authenticated.
  if (
    !user &&
    !isPublicPath
  ) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith('/club')
      ? '/club/login'
      : pathname.startsWith('/coach')
        ? '/coach/login'
        : '/login'
    return NextResponse.redirect(url)
  }

  if (!user) return response

  const { data: memberships } = await supabase
    .from('organization_memberships')
    .select('role, status')
    .eq('user_id', user.id)
  const access = classifyOrganizationAccess(memberships)

  if (access.isClubOnlyIdentity && isAnalystApiRoute(pathname)) {
    return NextResponse.json({ error: 'Analyst API access is not available to club accounts.' }, { status: 403 })
  }
  if (access.isCoachOnlyIdentity && isAnalystApiRoute(pathname)) {
    return NextResponse.json({ error: 'Analyst API access is not available to coach accounts.' }, { status: 403 })
  }

  // Club identities never enter the analyst application, including after
  // membership revocation. The club layout then renders the inactive state.
  if (access.isClubOnlyIdentity && isAnalystRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/club'
    url.search = ''
    return NextResponse.redirect(url)
  }
  if (access.isCoachOnlyIdentity && isAnalystRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/coach/profile'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = access.isClubOnlyIdentity
      ? '/club'
      : access.isCoachOnlyIdentity
        ? '/coach/profile'
        : '/dashboard/overview'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/club/login') {
    const url = request.nextUrl.clone()
    url.pathname = access.hasActiveClubAccess ? '/club' : access.hasActiveInternalAccess ? '/dashboard/overview' : '/club'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/coach/login') {
    const url = request.nextUrl.clone()
    url.pathname = access.hasActiveCoachAccess
      ? '/coach/profile'
      : access.hasActiveInternalAccess
        ? '/dashboard'
        : '/coach/profile'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
