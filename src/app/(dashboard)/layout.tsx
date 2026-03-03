import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from './_components/sidebar'

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

  // On setup page → render with sidebar so Admin nav is always available
  if (!hasClub && isSetupPage) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="pl-[220px]">
          <main className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Has club + on setup page → redirect away from setup to dashboard
  if (hasClub && isSetupPage) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-[220px]">
        <main className="min-h-screen">
          <div className="max-w-[1400px] mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
