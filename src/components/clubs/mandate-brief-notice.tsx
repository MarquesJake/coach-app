import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { effectiveBrief } from '@/lib/clubs/brief-amendments'

export async function MandateBriefNotice({ mandateId }: { mandateId: string }) {
  const db = await createServerSupabaseClient()
  const briefs = await db.from('club_briefs').select('*').eq('linked_mandate_id', mandateId)
  if (briefs.error) return <p role="alert" className="m-4 rounded border border-red-300 p-3 text-sm">The club brief didn’t load. Check Club briefs before relying on these requirements.</p>
  if (!briefs.data.length) return null
  const result = await db.from('club_brief_amendments').select('*').in('brief_id', briefs.data.map(b => b.id))
  return <aside className="m-4 space-y-3 rounded border border-border bg-card p-4">
    {result.error && <p role="alert" className="text-sm">Changes to the brief didn’t load, so we can’t confirm the latest version.</p>}
    {briefs.data.map(brief => {
      const amendments = (result.data ?? []).filter(a => a.brief_id === brief.id)
      const agreed = effectiveBrief(brief, amendments)
      return <div key={brief.id} className="space-y-1 text-sm">
        <Link href={`/club-briefs#brief-${brief.id}`} className="font-semibold underline">{agreed.snapshot.title} · {result.error ? 'version unconfirmed' : `agreed version ${agreed.version}`}</Link>
        {amendments.some(a => a.status === 'pending') && <p>The club has asked for a change. The current version stands until it’s reviewed.</p>}
        {agreed.version > 1 && <p className="text-muted-foreground">The club brief has changed. Check what was agreed and the next step — the mandate, assessments and reports don’t update on their own.</p>}
      </div>
    })}
  </aside>
}
