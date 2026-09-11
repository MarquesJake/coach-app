import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getOrganizationAccessProfile } from '@/lib/organizations/context'
import {
  canEnterAnalystApplication,
  resolveWorkspaceHome,
} from '@/lib/organizations/access'
import { Sidebar } from './_components/sidebar'
import { DemoNotice } from '@/components/demo-notice'

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
    <div className="gaffa-workspace min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:p-3">Skip to content</a>
      <Sidebar />
      <div className="pt-14 md:pl-[220px] md:pt-0 print:!pl-0 print:!pt-0">
        <main id="main-content" tabIndex={-1} className="min-h-screen min-w-0">
          <div className="gaffa-content">
            <DemoNotice />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
