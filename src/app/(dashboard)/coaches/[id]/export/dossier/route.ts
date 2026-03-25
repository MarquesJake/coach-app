import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCoachById } from '@/lib/db/coaches'

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return ''
  const t = String(s)
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatNum(v: number | null | undefined): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? '—' : String(Math.round(n))
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

  const { data: coach, error } = await getCoachById(user.id, params.id)
  if (error || !coach) {
    return new Response('Not found', { status: 404 })
  }

  const c = coach as Record<string, unknown>
  const name = escapeHtml((c.preferred_name ?? c.name) as string) || 'Coach'

  // @ts-ignore - coach_derived_metrics table not yet in DB schema
  const derivedMetricsQuery = supabase.from('coach_derived_metrics').select('*').eq('coach_id', params.id).maybeSingle()
  const [{ data: stints }, { data: derivedRow }, { data: evidence }] = await Promise.all([
    supabase.from('coach_stints').select('club_name, role_title, started_on, ended_on').eq('coach_id', params.id).order('started_on', { ascending: false }).limit(20),
    derivedMetricsQuery,
    supabase.from('intelligence_items').select('id, title, category, confidence').eq('entity_type', 'coach').eq('entity_id', params.id).limit(30),
  ])

  const dm = derivedRow as Record<string, unknown> | null
  const recruitmentDensity = dm && (dm.repeat_signings_count != null || dm.repeat_agents_count != null || dm.loan_reliance_score != null)
    ? formatNum(
        (Number(dm.repeat_signings_count ?? 0) * 0.4 + Number(dm.repeat_agents_count ?? 0) * 0.35 + (100 - Number(dm.loan_reliance_score ?? 0)) * 0.25)
    )
    : '—'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Coach Dossier – ${escapeHtml(name)}</title>
  <style>
    body { font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #666; }
    .muted { color: #666; }
    .score { font-weight: 600; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Coach Dossier</h1>
  <p class="muted">${escapeHtml(name)} · Generated for board use</p>

  <h2>Executive Summary</h2>
  <table>
    <tr><th>Overall score</th><td class="score">${formatNum(c.overall_manual_score as number)}</td></tr>
    <tr><th>Tactical fit</th><td>${formatNum(c.tactical_fit_score as number)}</td></tr>
    <tr><th>Leadership</th><td>${formatNum(c.leadership_score as number)}</td></tr>
    <tr><th>Recruitment fit</th><td>${formatNum(c.recruitment_fit_score as number)}</td></tr>
    <tr><th>Media risk</th><td>${formatNum(c.media_risk_score as number)}</td></tr>
    <tr><th>Intelligence confidence</th><td>${formatNum(c.intelligence_confidence as number)}</td></tr>
    <tr><th>Availability</th><td>${escapeHtml((c.availability_status as string) ?? '—')}</td></tr>
    <tr><th>Market status</th><td>${escapeHtml((c.market_status as string) ?? '—')}</td></tr>
  </table>

  <h2>Coaching Model</h2>
  <table>
    <tr><th>Pressing intensity</th><td>${escapeHtml((c.pressing_intensity as string) ?? '—')}</td></tr>
    <tr><th>Build preference</th><td>${escapeHtml((c.build_preference as string) ?? '—')}</td></tr>
    <tr><th>Leadership style</th><td>${escapeHtml((c.leadership_style as string) ?? '—')}</td></tr>
    <tr><th>Tactical identity</th><td>${escapeHtml((c.tactical_identity as string) ?? '—')}</td></tr>
  </table>

  <h2>Career Overview</h2>
  ${(stints?.length ?? 0) > 0
    ? `<table><thead><tr><th>Club</th><th>Role</th><th>From</th><th>To</th></tr></thead><tbody>
${(stints as { club_name: string | null; role_title: string | null; started_on: string | null; ended_on: string | null }[]).map((s) => `
  <tr><td>${escapeHtml(s.club_name)}</td><td>${escapeHtml(s.role_title)}</td><td>${escapeHtml(s.started_on ? s.started_on.slice(0, 10) : '—')}</td><td>${escapeHtml(s.ended_on ? s.ended_on.slice(0, 10) : '—')}</td></tr>`).join('')}
</tbody></table>`
    : '<p class="muted">No data available.</p>'}

  <h2>Squad DNA</h2>
  <table>
    <tr><th>Average squad age</th><td>${dm ? formatNum(dm.avg_squad_age as number) : '—'}</td></tr>
    <tr><th>Youth minutes %</th><td>${dm ? formatNum(dm.pct_minutes_u23 as number) : '—'}</td></tr>
    <tr><th>Senior minutes %</th><td>${dm ? formatNum(dm.pct_minutes_30plus as number) : '—'}</td></tr>
    <tr><th>Rotation index</th><td>${dm ? formatNum(dm.rotation_index as number) : '—'}</td></tr>
    <tr><th>Average signing age</th><td>${dm ? formatNum(dm.avg_signing_age as number) : '—'}</td></tr>
    <tr><th>Repeat signings</th><td>${dm ? String(dm.repeat_signings_count ?? '—') : '—'}</td></tr>
    <tr><th>Repeat agents</th><td>${dm ? String(dm.repeat_agents_count ?? '—') : '—'}</td></tr>
    <tr><th>Network density</th><td>${dm ? formatNum(dm.network_density_score as number) : '—'}</td></tr>
    <tr><th>Recruitment network density</th><td>${recruitmentDensity}</td></tr>
  </table>

  <h2>Risk & Intelligence</h2>
  <table>
    <tr><th>Legal risk flag</th><td>${(c.legal_risk_flag as boolean) ? 'Yes' : 'No'}</td></tr>
    <tr><th>Integrity risk flag</th><td>${(c.integrity_risk_flag as boolean) ? 'Yes' : 'No'}</td></tr>
    <tr><th>Safeguarding risk flag</th><td>${(c.safeguarding_risk_flag as boolean) ? 'Yes' : 'No'}</td></tr>
    <tr><th>Intelligence items</th><td>${evidence?.length ?? 0}</td></tr>
  </table>
  ${(evidence?.length ?? 0) > 0 ? `<p class="muted">Sample: ${(evidence as { title: string }[]).slice(0, 5).map((e) => escapeHtml(e.title)).join('; ')}${(evidence?.length ?? 0) > 5 ? '…' : ''}</p>` : ''}

  <h2>Mandate Fit</h2>
  <p class="muted">Fit scores are computed per mandate. Use the platform to view mandate-specific fit.</p>

  <p class="muted" style="margin-top: 32px;">Confidential. For internal use only.</p>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
