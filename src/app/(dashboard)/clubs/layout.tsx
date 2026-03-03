import { SectionShell } from '../_components/section-shell'
import { CLUBS_SUBNAV } from '../_components/module-nav'

export default function ClubsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Clubs"
      description="Manage clubs for mandates and matches"
      subnav={CLUBS_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
