import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getClubPortalContext } from '@/lib/organizations/context'
import { ClubSidebar } from './_components/club-sidebar'

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/club/login')
  const context = await getClubPortalContext()

  if (!context) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md rounded-md border border-border bg-card p-6 text-center">
          <ShieldAlert className="mx-auto h-6 w-6 text-amber-600" />
          <h1 className="mt-4 text-lg font-semibold text-foreground">Club access is not active</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Your sign-in works, but this account has not yet been assigned to a club decision room. Ask Coach First to confirm the club and your role.</p>
          <Link href="/dashboard" className="mt-5 inline-flex rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">Return to workspace</Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ClubSidebar organizationName={context.organizationName} />
      <div className="pl-[220px]">
        <main className="mx-auto min-h-screen max-w-[1280px] px-7 py-7">{children}</main>
      </div>
    </div>
  )
}
