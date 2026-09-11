import Link from 'next/link'
import { Building2 } from 'lucide-react'

export const metadata = { title: 'Clubs' }


export default function ClubsIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] gap-4 text-center px-8 py-10">
      <h1 className="sr-only">Clubs</h1>
      <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
        <Building2 className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Select a club</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Choose a club from the list to view its intelligence profile,
          coaching history, and season data.
        </p>
      </div>
      <Link
        href="/clubs/new"
        className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground font-medium text-xs rounded-lg hover:bg-primary/90 transition-colors mt-2"
      >
        + Add club
      </Link>
    </div>
  )
}
