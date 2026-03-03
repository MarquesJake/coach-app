import { SectionShell } from '../_components/section-shell'
import { STAFF_SUBNAV } from '../_components/module-nav'

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Staff"
      description="Technical staff and coaching networks"
      subnav={STAFF_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
