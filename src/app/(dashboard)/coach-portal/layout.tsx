import { SectionShell } from '../_components/section-shell'
import { COACH_PORTAL_SUBNAV } from '../_components/module-nav'

export default function CoachPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Coach Portal"
      description="Coach-supplied profiles, methodology, video and confidential material"
      subnav={COACH_PORTAL_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
