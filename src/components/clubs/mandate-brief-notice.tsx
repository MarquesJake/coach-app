import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { effectiveBrief } from '@/lib/clubs/brief-amendments'

export async function MandateBriefNotice({ mandateId }: { mandateId: string }) {
  const db = await createServerSupabaseClient()
  const briefs = await db.from('club_briefs').select('*').eq('linked_mandate_id', mandateId)
  if (briefs.error) return <p role="alert" className="m-4 rounded border border-red-300 p-3 text-sm">Linked club briefs could not be loaded. Check the intake queue before relying on mandate requirements.</p>
  if (!briefs.data.length) return null
  const result = await db.from('club_brief_amendments').select('*').in('brief_id', briefs.data.map(b => b.id))
  return <aside className="m-4 space-y-3 rounded border border-border bg-card p-4">
    {result.error && <p role="alert" className="text-sm">Amendment history is unavailable. Brief versions cannot be confirmed.</p>}
    {briefs.data.map(brief => {
      const amendments = (result.data ?? []).filter(a => a.brief_id === brief.id)
      const agreed = effectiveBrief(brief, amendments)
      return <div key={brief.id} className="space-y-1 text-sm">
        <Link href={`/club-briefs#brief-${brief.id}`} className="font-semibold underline">{agreed.snapshot.title} · {result.error ? 'version unconfirmed' : `agreed version ${agreed.version}`}</Link>
        {amendments.some(a => a.status === 'pending') && <p>Club amendment awaiting review. The current agreed version remains in force.</p>}
        {agreed.version > 1 && <p className="text-muted-foreground">The club brief has been amended. Review the decision history and recorded next action; mandate criteria, candidate assessments and existing packs are not automatically rewritten.</p>}
      </div>
    })}
  </aside>
}
