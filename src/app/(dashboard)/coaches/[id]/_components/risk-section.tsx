'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { AlertTriangle } from 'lucide-react'
import { EditCoachDrawer, type EditCoachField } from './edit-coach-drawer'
import { SourceConfidenceFields, IntelPill } from '@/components/source-confidence-fields'
import { updateCoachCoreAction, upsertDueDiligenceItemAction, deleteDueDiligenceItemAction } from '@/app/(dashboard)/coaches/[id]/actions'
import { toastSuccess, toastError } from '@/lib/ui/toast'
import { useRouter } from 'next/navigation'

const RISK_FIELDS: EditCoachField[] = [
  { key: 'legal_risk_flag', label: 'Legal risk flagged', type: 'checkbox' },
  { key: 'integrity_risk_flag', label: 'Integrity risk flagged', type: 'checkbox' },
  { key: 'safeguarding_risk_flag', label: 'Safeguarding risk flagged', type: 'checkbox' },
  { key: 'due_diligence_summary', label: 'Due diligence summary', type: 'textarea' },
  { key: 'compliance_notes', label: 'Compliance notes', type: 'textarea' },
]

type CoachRecord = Record<string, unknown>
type EvidenceItem = { id: string; title: string; detail: string | null; category: string | null; confidence: number | null; occurred_at: string | null; source_name: string | null; source_type: string | null; verified: boolean }
type DueDiligenceItem = {
  id: string
  title: string
  detail: string | null
  source_type: string | null
  source_name: string | null
  confidence: number | null
  verified: boolean
}

type CoverageItem = { category: string; itemCount: number; averageConfidence: number }

export function RiskSection({ coachId, coach, evidence, dueDiligenceItems, coverageByCategory = [] }: { coachId: string; coach: CoachRecord; evidence: EvidenceItem[]; dueDiligenceItems: DueDiligenceItem[]; coverageByCategory?: CoverageItem[] }) {
  const router = useRouter()
  const [ddDrawerOpen, setDdDrawerOpen] = useState(false)
  const [ddEditing, setDdEditing] = useState<DueDiligenceItem | null>(null)
  const [ddError, setDdError] = useState<string | null>(null)

  const openDdAdd = () => {
    setDdEditing(null)
    setDdError(null)
    setDdDrawerOpen(true)
  }
  const openDdEdit = (item: DueDiligenceItem) => {
    setDdEditing(item)
    setDdError(null)
    setDdDrawerOpen(true)
  }
  const closeDdDrawer = () => {
    setDdDrawerOpen(false)
    setDdEditing(null)
    setDdError(null)
  }

  const onDdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDdError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('id', ddEditing?.id ?? '')
    const result = await upsertDueDiligenceItemAction(coachId, formData)
    if (result.error) {
      setDdError(result.error)
      toastError(result.error)
      return
    }
    toastSuccess(ddEditing ? 'Updated' : 'Added')
    closeDdDrawer()
    router.refresh()
  }
  const onDdDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const result = await deleteDueDiligenceItemAction(coachId, id)
    if (result.error) toastError(result.error)
    else {
      toastSuccess('Deleted')
      closeDdDrawer()
      router.refresh()
    }
  }

  const legalRisk = (coach.legal_risk_flag as boolean) ?? false
  const integrityRisk = (coach.integrity_risk_flag as boolean) ?? false
  const safeguardingRisk = (coach.safeguarding_risk_flag as boolean) ?? false
  const complianceNotes = coach.compliance_notes as string | null | undefined
  const dueDiligenceSummary = coach.due_diligence_summary as string | null | undefined

  const initialValues: Record<string, unknown> = {
    legal_risk_flag: coach.legal_risk_flag ?? false,
    integrity_risk_flag: coach.integrity_risk_flag ?? false,
    safeguarding_risk_flag: coach.safeguarding_risk_flag ?? false,
    due_diligence_summary: coach.due_diligence_summary ?? '',
    compliance_notes: coach.compliance_notes ?? '',
  }

  const handleSave = async (payload: Record<string, unknown>) => {
    const result = await updateCoachCoreAction(coachId, payload)
    if (!result.ok) {
      toastError(result.error)
      return result
    }
    toastSuccess('Risk flags updated')
    return result
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">
            Risk flags
          </h2>
          <EditCoachDrawer
            title="Edit risk & compliance"
            triggerLabel="Edit"
            fields={RISK_FIELDS}
            initialValues={initialValues}
            onSave={handleSave}
            onSuccess={() => router.refresh()}
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Legal</span>
            {legalRisk ? (
              <Badge variant="danger" className="gap-1"><AlertTriangle className="w-3 h-3" /> Flagged</Badge>
            ) : (
              <Badge variant="secondary">None</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Integrity</span>
            {integrityRisk ? (
              <Badge variant="danger" className="gap-1"><AlertTriangle className="w-3 h-3" /> Flagged</Badge>
            ) : (
              <Badge variant="secondary">None</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Safeguarding</span>
            {safeguardingRisk ? (
              <Badge variant="danger" className="gap-1"><AlertTriangle className="w-3 h-3" /> Flagged</Badge>
            ) : (
              <Badge variant="secondary">None</Badge>
            )}
          </div>
        </div>
        {complianceNotes && (
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Compliance notes</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{complianceNotes}</p>
          </div>
        )}
        {dueDiligenceSummary && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due diligence summary</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{dueDiligenceSummary}</p>
          </div>
        )}
        {!legalRisk && !integrityRisk && !safeguardingRisk && !complianceNotes && !dueDiligenceSummary && (
          <p className="text-sm text-muted-foreground py-2">No data available.</p>
        )}
      </section>

      {/* Coverage by Category */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Coverage by category</h2>
        <div className="space-y-3">
          {(coverageByCategory.length ? coverageByCategory : [
            { category: 'Tactical', itemCount: 0, averageConfidence: 0 },
            { category: 'Leadership', itemCount: 0, averageConfidence: 0 },
            { category: 'Recruitment', itemCount: 0, averageConfidence: 0 },
            { category: 'Media', itemCount: 0, averageConfidence: 0 },
            { category: 'Legal', itemCount: 0, averageConfidence: 0 },
            { category: 'Integrity', itemCount: 0, averageConfidence: 0 },
            { category: 'Staff', itemCount: 0, averageConfidence: 0 },
            { category: 'Performance', itemCount: 0, averageConfidence: 0 },
            { category: 'Market', itemCount: 0, averageConfidence: 0 },
          ]).map(({ category, itemCount, averageConfidence }) => (
            <div key={category}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground font-medium">{category}</span>
                <span className="text-muted-foreground tabular-nums">{itemCount} items · {averageConfidence}% avg</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${Math.min(100, averageConfidence)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 mt-4">
        <h2 className="text-lg font-medium text-foreground mb-4">
          Intelligence evidence
        </h2>
        {!evidence?.length ? (
          <p className="text-sm text-muted-foreground py-4">No data available.</p>
        ) : (
          <ul className="space-y-3">
            {evidence.map((e) => (
              <li key={e.id} className="border-b border-border/50 pb-3 last:border-0">
                <p className="font-medium text-foreground text-sm">{e.title}</p>
                {e.detail && <p className="text-xs text-muted-foreground mt-1">{e.detail}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {e.category && `${e.category} · `}
                  {e.occurred_at ? new Date(e.occurred_at).toLocaleDateString('en-GB') : ''}
                </p>
                <IntelPill confidence={e.confidence} verified={e.verified} sourceType={e.source_type} sourceName={e.source_name} className="mt-1" />
              </li>
            ))}
          </ul>
        )}
        <Link href="/intelligence" className="inline-block mt-3 text-xs text-primary hover:underline">Open Intelligence feed</Link>
      </section>

      {/* Due diligence items */}
      <section className="rounded-lg border border-border bg-card p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Due diligence items</h2>
          <Button variant="outline" onClick={openDdAdd}>Add item</Button>
        </div>
        {!dueDiligenceItems?.length ? (
          <p className="text-sm text-muted-foreground py-4">No items.</p>
        ) : (
          <ul className="space-y-2">
            {dueDiligenceItems.map((item) => (
              <li key={item.id} className="flex justify-between items-start gap-2 border-b border-border/50 pb-2 last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
                  <IntelPill confidence={item.confidence} verified={item.verified} sourceType={item.source_type} sourceName={item.source_name} className="mt-1" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => openDdEdit(item)}>Edit</Button>
                  <Button variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => onDdDelete(item.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Drawer open={ddDrawerOpen} onClose={closeDdDrawer} title={ddEditing ? 'Edit due diligence item' : 'Add due diligence item'}
        footer={
          <>
            {ddEditing && <Button variant="destructive" className="mr-auto" onClick={() => onDdDelete(ddEditing.id)}>Delete</Button>}
            <Button variant="outline" onClick={closeDdDrawer}>Cancel</Button>
            <Button type="submit" form="dd-form">{ddEditing ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="dd-form" onSubmit={onDdSubmit} className="space-y-4">
          {ddError && <p className="text-sm text-destructive">{ddError}</p>}
          <input type="hidden" name="id" value={ddEditing?.id ?? ''} />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Title</label>
            <input name="title" required defaultValue={ddEditing?.title ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Detail</label>
            <textarea name="detail" rows={2} defaultValue={ddEditing?.detail ?? ''} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground resize-none" />
          </div>
          <SourceConfidenceFields
            initial={{
              source_type: ddEditing?.source_type ?? null,
              source_name: (ddEditing as { source_name?: string | null })?.source_name ?? null,
              source_link: (ddEditing as { source_link?: string | null })?.source_link ?? null,
              source_notes: (ddEditing as { source_notes?: string | null })?.source_notes ?? null,
              confidence: ddEditing?.confidence ?? null,
              verified: (ddEditing as { verified?: boolean })?.verified ?? false,
              verified_by: (ddEditing as { verified_by?: string | null })?.verified_by ?? null,
              verified_at: null,
            }}
          />
        </form>
      </Drawer>
    </div>
  )
}
