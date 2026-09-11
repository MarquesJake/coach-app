import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = { title: 'Identity review · Coaches' }


export default async function IdentityReviewPage() {
  const db = await createServerSupabaseClient()
  const { data, error } = await db.from('coaches').select('id,name,date_of_birth,nationality,club_current').order('name')
  const groups = new Map<string, NonNullable<typeof data>>()
  for (const row of data ?? []) {
    const name=(row.name || '').trim().toLowerCase()
    if (!name) continue
    groups.set(name,[...(groups.get(name) ?? []),row])
  }
  const duplicates=[...groups.values()].filter(rows=>rows.length>1)
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/coaches/compare" className="text-sm text-primary underline">Back to comparison</Link><h1 className="text-2xl font-semibold">Coach identity review</h1><p className="text-sm text-muted-foreground">These records have the same name. Confirm identity using dates of birth, source identifiers and career history before combining information. A matching name or current club alone is insufficient. Abbreviated names may need a separate manual review.</p>{error ? <p role="alert">Could not load identities. Reload to retry.</p> : duplicates.length===0 ? <p>No exact-name duplicates in the accessible records.</p> : duplicates.map(rows=><section className="rounded-xl border bg-card p-5" key={rows[0].id}><h2 className="font-semibold">{rows[0].name} · {rows.length} records</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{rows.map(row=><div key={row.id} className="rounded border p-3 text-sm"><p>Birth date: {row.date_of_birth || 'Not recorded'}</p><p>Nationality: {row.nationality || 'Not recorded'}</p><p>Recorded club: {row.club_current || 'Not recorded'}</p><p className="mt-2 text-xs text-muted-foreground">Record {row.id.slice(0,8)}</p><Link className="mt-2 inline-block text-primary underline" href={`/coaches/${row.id}/record`}>Review full record</Link></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Preserve linked research, mandates, evidence and access history when resolving identity. No records have been merged or deleted.</p></section>)}</div>
}
