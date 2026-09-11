import { SectionShell } from '../_components/section-shell'
import { NETWORK_SUBNAV } from '../_components/module-nav'

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      title="Football network"
      description="Trusted contacts, who knows whom, and references"
      subnav={NETWORK_SUBNAV}
      sticky
    >
      {children}
    </SectionShell>
  )
}
