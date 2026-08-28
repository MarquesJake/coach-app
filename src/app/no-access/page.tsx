import { ShieldAlert } from 'lucide-react'
import { NoAccessSignOut } from './_components/no-access-sign-out'

export const metadata = {
  title: 'No workspace assigned',
}

export default function NoAccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
        <div className="card-surface w-full rounded-lg p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
            <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            No workspace assigned
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            This account is signed in but has not been granted access to a Coach
            First workspace. Access is issued by invitation, so nothing is
            available here until an administrator adds this account to an
            organization.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            If you were expecting access, contact the person who invited you and
            ask them to confirm the invitation was completed.
          </p>
          <NoAccessSignOut>Sign out</NoAccessSignOut>
        </div>
      </div>
    </div>
  )
}
