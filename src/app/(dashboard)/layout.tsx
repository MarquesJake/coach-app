import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TopNav } from './_components/top-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const hasClub = clubs && clubs.length > 0

  // Read current pathname from headers (set by Next.js middleware)
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || ''
  const isSetupPage = pathname === '/dashboard/setup'

  // No club and not on setup page → redirect to setup
  if (!hasClub && !isSetupPage) {
    redirect('/dashboard/setup')
  }

  // On setup page → render without nav
  if (!hasClub && isSetupPage) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // Has club + on setup page → redirect away from setup to dashboard
  if (hasClub && isSetupPage) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pt-[calc(var(--nav-height)+var(--tab-height))] min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
