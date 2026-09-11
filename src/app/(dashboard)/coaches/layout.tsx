import { SectionShell } from '../_components/section-shell'

// The directory page is a client component, so its title is set here. A plain
// string title would stop the root "%s · Gaffa" template reaching the sub-pages
// below this layout, so the template is restated.
export const metadata = { title: { default: 'Coaches', template: '%s · Gaffa' } }
import { COACHES_SUBNAV } from '../_components/module-nav'

export default function CoachesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Coaches"
      description="Coach database, compare and watchlist"
      subnav={COACHES_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
