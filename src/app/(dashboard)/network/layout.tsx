import { SectionShell } from '../_components/section-shell'
import { NETWORK_SUBNAV } from '../_components/module-nav'

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      title="Football network"
      description="Trusted contacts, first-hand relationships and reference coverage"
      subnav={NETWORK_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
