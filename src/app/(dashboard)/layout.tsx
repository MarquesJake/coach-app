import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrganizationAccessProfile } from '@/lib/organizations/context'
import {
  canEnterAnalystApplication,
  resolveWorkspaceHome,
} from '@/lib/organizations/access'
import { Sidebar } from './_components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const organizationAccess = await getOrganizationAccessProfile(user.id)
  if (organizationAccess.isClubOnlyIdentity) {
    redirect('/club')
  }

  // Defence in depth behind the middleware guard: analyst surfaces require an
  // active internal membership, never merely the absence of another identity.
  if (!canEnterAnalystApplication(organizationAccess)) {
    redirect(resolveWorkspaceHome(organizationAccess))
  }

  // Internal membership is the entry condition for the analyst application.
  // Owning a personal club row is not: the workspace is the team's, so a new
  // analyst joins a populated application rather than an empty setup form.

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pt-14 md:pl-[220px] md:pt-0">
        <main className="min-h-screen">
          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
