import { ClubBrowserPanel } from './_components/club-browser-panel'

export default function ClubsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Sits inside the workspace padding rather than bleeding out of it with
    // negative margins, which broke whenever that padding changed (it overflowed
    // on mobile and covered the prototype notice). Height leaves room for the
    // notice and the workspace padding so the page itself does not scroll.
    <div className="flex flex-col overflow-hidden rounded-xl border border-border md:h-[calc(100vh-8.5rem)] md:min-h-[520px] md:flex-row">

      {/* Club browser: stacked above the detail on mobile, beside it from md */}
      <div className="flex h-[60vh] min-h-64 w-full shrink-0 flex-col overflow-hidden border-b border-border bg-card md:h-auto md:w-[272px] md:border-b-0 md:border-r">
        <ClubBrowserPanel />
      </div>

      {/* Right: club detail / new / list */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-background">
        {children}
      </div>

    </div>
  )
}
