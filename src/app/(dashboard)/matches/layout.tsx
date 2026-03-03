import { SectionShell } from '../_components/section-shell'
import { MATCHES_SUBNAV } from '../_components/module-nav'

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Matches"
      description="Matches, reports and context"
      subnav={MATCHES_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
