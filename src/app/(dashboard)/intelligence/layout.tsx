import { SectionShell } from '../_components/section-shell'
import { ResearchSectionNav } from './_components/research-section-nav'
import { ResearchContextBanner } from '../coaches/_components/research-context-link'

export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SectionShell
      title="Research & sources"
      description="Current signals, conversations and reviewed findings"
      sticky
    >
      <ResearchSectionNav/>
      <ResearchContextBanner/>
      {children}
    </SectionShell>
  )
}
