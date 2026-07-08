import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  LockKeyhole,
  PlaySquare,
  ShieldCheck,
  UploadCloud,
  Users,
} from 'lucide-react'

const sections = [
  {
    title: 'Football identity',
    detail: 'Game model, in-possession principles, out-of-possession behaviours, transition rules and set-piece approach.',
    status: 'Complete',
  },
  {
    title: 'Training week',
    detail: 'Typical match-week rhythm, session design, unit work, individual development and load management.',
    status: 'Needs video',
  },
  {
    title: 'Staff network',
    detail: 'Assistant coach, analyst, goalkeeper coach, S&C, recruitment preferences and likely staff to follow.',
    status: 'Draft',
  },
  {
    title: 'References',
    detail: 'Who Coach First can contact, who should stay confidential, and the right timing for each call.',
    status: 'Complete',
  },
]

const materials = [
  {
    icon: FileText,
    title: 'Head coach presentation',
    meta: 'PDF / PowerPoint - visible to Coach First',
    status: 'Verified',
  },
  {
    icon: PlaySquare,
    title: 'Training session: build-out under pressure',
    meta: 'Video link - club access requires approval',
    status: 'Private',
  },
  {
    icon: FileText,
    title: 'Game model methodology',
    meta: 'PDF - pending analyst review',
    status: 'Review',
  },
]

const requests = [
  {
    club: 'QPR head coach process',
    requester: 'Sporting director request',
    reason: 'Review training footage and presentation before final interview stage.',
    status: 'Awaiting approval',
  },
]

function StatusPill({ status }: { status: string }) {
  const tone = status === 'Verified' || status === 'Complete'
    ? 'border-emerald-700/25 bg-emerald-50 text-emerald-800'
    : status === 'Private' || status === 'Awaiting approval'
      ? 'border-slate-300 bg-slate-100 text-slate-700'
      : 'border-amber-500/30 bg-amber-50 text-amber-800'

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {status}
    </span>
  )
}

export default function CoachProfilePreviewPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <header className="border-b border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/coach/login" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-3.5 w-3.5" />
              Coach access
            </Link>
            <h1 className="mt-1 font-serif text-2xl font-semibold">Brian Barry-Murphy</h1>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-emerald-900/15 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
            <ShieldCheck className="h-4 w-4" />
            Coach First verified profile
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Profile readiness</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">82%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[82%] rounded-full bg-emerald-800" />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Strong enough for Coach First review. Add match analysis and one more training video before club release.
            </p>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Release control</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Coach First</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="flex items-center justify-between">
                <span>Clubs on request</span>
                <LockKeyhole className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex items-center justify-between">
                <span>Public profile</span>
                <LockKeyhole className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                  Coach-owned profile
                </p>
                <h2 className="mt-2 text-xl font-semibold">Keep the football detail current</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  This is the coach-side version of the profile. The coach supplies the material;
                  Coach First verifies it, challenges it and decides what enters a club assessment.
                </p>
              </div>
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-900 px-3 py-2 text-sm font-semibold text-white">
                <UploadCloud className="h-4 w-4" />
                Upload material
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {sections.map((section) => (
              <div key={section.title} className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <StatusPill status={section.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{section.detail}</p>
                <button className="mt-4 text-xs font-semibold text-emerald-800 hover:text-emerald-950">
                  Edit section
                </button>
              </div>
            ))}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Private material library</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Presentations, methodology, training sessions, match clips and reference packs.
                </p>
              </div>
              <StatusPill status="Controlled access" />
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {materials.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start justify-between gap-4 py-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.meta}</p>
                      </div>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-800" />
              <h2 className="text-sm font-semibold">Club access requests</h2>
            </div>
            <div className="mt-4 space-y-3">
              {requests.map((request) => (
                <div key={request.club} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{request.club}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{request.requester}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{request.reason}</p>
                    </div>
                    <StatusPill status={request.status} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-md bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white">
                      Approve selected files
                    </button>
                    <button className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                      Ask Coach First first
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
