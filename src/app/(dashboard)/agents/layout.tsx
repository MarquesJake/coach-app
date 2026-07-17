import { SectionShell } from '../_components/section-shell'
import { AGENTS_SUBNAV } from '../_components/module-nav'

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Agents"
      description="Agent relationships, conversations and coach links"
      subnav={AGENTS_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
