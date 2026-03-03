import { SectionShell } from '../_components/section-shell'
import { MANDATES_SUBNAV } from '../_components/module-nav'

export default function MandatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Mandates"
      description="Client engagement and pipeline"
      subnav={MANDATES_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
