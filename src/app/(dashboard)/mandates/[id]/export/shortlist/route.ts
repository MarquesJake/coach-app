import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getMandateDetailForUser } from '@/lib/db/mandate'

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return ''
  const t = String(s)
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type ShortlistRow = {
  id: string
  coach_id: string
  placement_probability: number
  risk_rating: string
  status: string
  notes: string | null
  coaches: {
    name: string | null
    club_current: string | null
    nationality: string | null
  } | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { mandateResult, shortlistResult } = await getMandateDetailForUser(user.id, params.id)
  if (mandateResult.error || !mandateResult.data) {
    return new Response('Not found', { status: 404 })
  }

  const mandate = mandateResult.data as Record<string, unknown> & {
    custom_club_name?: string | null
    clubs?: { name?: string | null; league?: string | null } | null
    strategic_objective?: string | null
    ownership_structure?: string | null
    succession_timeline?: string | null
    board_risk_appetite?: string | null
    budget_band?: string | null
    engagement_date?: string | null
    target_completion_date?: string | null
    pipeline_stage?: string | null
  }
  const clubName = mandate.custom_club_name ?? mandate.clubs?.name ?? 'Unknown club'
  const shortlist = ((shortlistResult as { data?: ShortlistRow[] | null })?.data ?? []) as ShortlistRow[]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Mandate Shortlist – ${escapeHtml(String(clubName))}</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #1a1a1a; max-width: 900px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #666; }
    .muted { color: #666; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Mandate Shortlist</h1>
  <p class="muted">${escapeHtml(String(clubName))} · Confidential</p>

  <h2>Club context</h2>
  <table>
    <tr><th>Engagement date</th><td>${escapeHtml(mandate.engagement_date ? String(mandate.engagement_date).slice(0, 10) : '—')}</td></tr>
    <tr><th>Target completion</th><td>${escapeHtml(mandate.target_completion_date ? String(mandate.target_completion_date).slice(0, 10) : '—')}</td></tr>
    <tr><th>Board risk appetite</th><td>${escapeHtml(String(mandate.board_risk_appetite ?? '—'))}</td></tr>
    <tr><th>Budget band</th><td>${escapeHtml(String(mandate.budget_band ?? '—'))}</td></tr>
    <tr><th>Pipeline stage</th><td>${escapeHtml(String(mandate.pipeline_stage ?? '—'))}</td></tr>
  </table>

  <h2>Mandate requirements</h2>
  <p><strong>Strategic objective:</strong> ${escapeHtml(String(mandate.strategic_objective ?? '—'))}</p>
  <p><strong>Ownership structure:</strong> ${escapeHtml(String(mandate.ownership_structure ?? '—'))}</p>
  <p><strong>Succession timeline:</strong> ${escapeHtml(String(mandate.succession_timeline ?? '—'))}</p>

  <h2>Shortlist</h2>
  ${shortlist.length > 0
    ? `<table>
  <thead><tr><th>Coach</th><th>Club / status</th><th>Nationality</th><th>Fit score</th><th>Risk</th><th>Status</th></tr></thead>
  <tbody>
${shortlist.map((row) => {
  const coach = row.coaches
  const name = coach?.name ?? 'Unknown'
  const club = coach?.club_current || 'Free agent'
  const nat = coach?.nationality ?? '—'
  return `    <tr>
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(club)}</td>
      <td>${escapeHtml(nat)}</td>
      <td>${row.placement_probability}%</td>
      <td>${escapeHtml(row.risk_rating)}</td>
      <td>${escapeHtml(row.status)}</td>
    </tr>`
}).join('\n')}
  </tbody>
</table>`
    : '<p class="muted">No data available.</p>'}

  <p class="muted" style="margin-top: 32px;">Confidential. For internal use only.</p>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
