import { SectionShell } from '../_components/section-shell'
import { INTELLIGENCE_SUBNAV } from '../_components/module-nav'

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Intelligence"
      description="Intelligence feed and sources"
      subnav={INTELLIGENCE_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
