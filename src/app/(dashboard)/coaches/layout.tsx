import { SectionShell } from '../_components/section-shell'
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
