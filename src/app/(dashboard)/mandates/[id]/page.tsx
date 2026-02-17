import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ScoreBar } from '@/components/ScoreBar'
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react'

function formatDate(value: string, withYear = true) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  })
}

export default async function MandateDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: mandate, error } = await supabase
    .from('mandates')
    .select(`
      id,
      status,
      priority,
      engagement_date,
      target_completion_date,
      ownership_structure,
      budget_band,
      strategic_objective,
      board_risk_appetite,
      succession_timeline,
      key_stakeholders,
      confidentiality_level,
      clubs (
        name,
        league
      ),
      mandate_shortlist (
        coach_id,
        placement_probability,
        risk_rating,
        status,
        coaches (
          id,
          name,
          nationality,
          current_club,
          financial_feasibility
        )
      ),
      mandate_deliverables (
        id,
        item,
        due_date,
        status
      )
    `)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !mandate) {
    notFound()
  }

  const shortlist = [...mandate.mandate_shortlist].sort((a, b) => b.placement_probability - a.placement_probability)
  const deliverables = [...mandate.mandate_deliverables].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  return (
    <div className="max-w-[1800px] mx-auto space-y-5">
      <Link
        href="/mandates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[10px] font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Mandates
      </Link>

      <div className="card-surface rounded p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-foreground">{mandate.clubs?.name ?? 'Unknown Club'}</h1>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  mandate.status === 'Active'
                    ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800/40'
                }`}
              >
                {mandate.status}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  mandate.priority === 'High'
                    ? 'bg-red-950/40 text-red-500 border-red-900/40'
                    : mandate.priority === 'Medium'
                      ? 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                      : 'bg-surface text-muted-foreground border-border'
                }`}
              >
                {mandate.priority} Priority
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider bg-surface text-muted-foreground border-border">
                {mandate.confidentiality_level}
              </span>
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {mandate.clubs?.league ?? 'Unknown League'} · Engagement: {formatDate(mandate.engagement_date)}
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-raised rounded text-[10px] font-bold transition-colors border border-border uppercase tracking-widest text-muted-foreground hover:text-foreground">
            <Download className="w-3 h-3" />
            Generate Executive Brief
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
          <div>
            <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Target Completion</div>
            <div className="text-sm font-semibold text-foreground">{formatDate(mandate.target_completion_date)}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Shortlist</div>
            <div className="text-sm font-semibold text-foreground">{shortlist.length} Candidates</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Board Risk Appetite</div>
            <div className="text-sm font-semibold text-foreground">{mandate.board_risk_appetite}</div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Key Stakeholders</div>
            <div className="text-sm font-semibold text-foreground">{mandate.key_stakeholders.length} Contacts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <div className="card-surface rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-foreground text-[11px] uppercase tracking-widest">Club Overview</h2>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Ownership Structure</div>
                <div className="text-xs text-foreground">{mandate.ownership_structure}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Strategic Objective</div>
                <div className="text-xs text-foreground leading-relaxed">{mandate.strategic_objective}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">Succession Timeline</div>
                <div className="text-xs text-foreground">{mandate.succession_timeline}</div>
              </div>
            </div>
          </div>

          <div className="card-surface rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-foreground text-[11px] uppercase tracking-widest">Budget Band</h2>
            </div>
            <div className="text-sm text-foreground font-semibold">{mandate.budget_band}</div>
          </div>

          <div className="card-surface rounded overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <h2 className="font-bold text-foreground text-[11px] uppercase tracking-widest">Ranked Shortlist</h2>
            </div>
            <div className="divide-y divide-border">
              {shortlist.map((item, index) => {
                const coach = item.coaches
                if (!coach) return null

                return (
                  <div key={item.coach_id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-surface text-xs font-bold text-muted-foreground flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded flex items-center justify-center text-base font-bold text-foreground flex-shrink-0">
                        {coach.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{coach.name}</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                              item.status === 'In Negotiations'
                                ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                                : item.status === 'Shortlisted'
                                  ? 'bg-slate-900/40 text-slate-400 border-slate-800/40'
                                  : item.status === 'Under Review'
                                    ? 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                                    : 'bg-red-950/40 text-red-500 border-red-900/40'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wide">
                          {coach.current_club || 'Free Agent'} · {coach.nationality || 'Unknown'}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Placement Probability</div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-foreground">{item.placement_probability}%</span>
                              <ScoreBar score={item.placement_probability} width="40px" />
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Risk Rating</div>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                item.risk_rating === 'Low'
                                  ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                                  : item.risk_rating === 'Medium'
                                    ? 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                                    : 'bg-red-950/40 text-red-500 border-red-900/40'
                              }`}
                            >
                              {item.risk_rating}
                            </span>
                          </div>
                          <div>
                            <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wide">Financial</div>
                            <ScoreBar score={coach.financial_feasibility ?? 0} width="50px" showLabel />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-surface rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-foreground text-[11px] uppercase tracking-widest">Key Stakeholders</h2>
            </div>
            <div className="space-y-2">
              {mandate.key_stakeholders.map((stakeholder, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-foreground">{stakeholder}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-bold text-foreground text-[11px] uppercase tracking-widest">Deliverables</h2>
            </div>
            <div className="space-y-3">
              {deliverables.map((deliverable) => (
                <div key={deliverable.id}>
                  <div className="flex items-start gap-2 mb-1">
                    {deliverable.status === 'Completed' && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                    {deliverable.status === 'In Progress' && (
                      <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    {deliverable.status === 'Not Started' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground">{deliverable.item}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                        Due: {formatDate(deliverable.due_date, false)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                      deliverable.status === 'Completed'
                        ? 'bg-emerald-950/40 text-emerald-500 border-emerald-900/40'
                        : deliverable.status === 'In Progress'
                          ? 'bg-amber-950/40 text-amber-600 border-amber-900/40'
                          : 'bg-surface text-muted-foreground border-border'
                    }`}
                  >
                    {deliverable.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
