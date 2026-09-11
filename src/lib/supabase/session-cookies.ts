/** Preserve the complete refresh cookie set when replacing an HTTP response. */
export function copySessionCookies<T extends { name: string; value: string }>(
  source: { getAll(): T[] },
  target: { set(cookie: T): unknown },
): void {
  source.getAll().forEach((cookie) => target.set(cookie))
}

export function loginPathFor(pathname: string): string {
  if (pathname === '/investor' || pathname.startsWith('/investor/')) return '/investor/login'
  if (pathname === '/club' || pathname.startsWith('/club/')) return '/club/login'
  if (pathname === '/coach' || pathname.startsWith('/coach/')) return '/coach/login'
  return '/login'
}
