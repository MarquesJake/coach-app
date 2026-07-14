import { ClubBrowserPanel } from './_components/club-browser-panel'

export default function ClubsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Break out of the parent px-6 py-6 padding so panels run edge-to-edge
    <div className="flex -mx-6 -mt-6 h-[calc(100vh-1.5rem)]">

      {/* Left: persistent club browser */}
      <div className="flex w-[272px] shrink-0 flex-col overflow-hidden border-r border-border bg-card">
        <ClubBrowserPanel />
      </div>

      {/* Right: club detail / new / list */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-background">
        {children}
      </div>

    </div>
  )
}
