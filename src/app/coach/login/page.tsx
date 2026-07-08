import Link from 'next/link'
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-700/25'

export default function CoachLoginPreviewPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-8 lg:px-10">
          <Link href="/" className="text-sm font-semibold tracking-[0.14em] text-emerald-900">
            COACH FIRST
          </Link>

          <div className="max-w-xl py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
              Private coach profile
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold leading-[1.03] text-slate-950">
              Your football work, prepared properly.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-650">
              Coaches sign in here to keep their methodology, presentation, training video,
              reference permissions and availability current. Coach First verifies the profile
              before anything is shared with a club.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ['01', 'Build your profile'],
                ['02', 'Upload private material'],
                ['03', 'Approve club access'],
              ].map(([num, label]) => (
                <div key={num} className="border-t border-emerald-900/25 pt-3">
                  <p className="text-xs font-semibold text-emerald-900">{num}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="max-w-md text-xs leading-5 text-slate-500">
            Invite-only access for coaches and representatives. Club sharing is controlled by
            Coach First and only happens after permission, review and verification.
          </p>
        </section>

        <section className="flex items-center bg-white px-6 py-10 shadow-[0_0_80px_rgba(15,23,42,0.08)] lg:px-12">
          <div className="w-full">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-900 text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Coach access</h2>
                <p className="text-sm text-slate-500">Sign in with your invited email.</p>
              </div>
            </div>

            <form className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Email
                </span>
                <input className={inputClass} placeholder="coach@example.com" type="email" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Password or invite code
                </span>
                <input className={inputClass} placeholder="Private access code" type="password" />
              </label>

              <Link
                href="/coach/profile"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-950"
              >
                Preview coach profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </form>

            <div className="mt-6 rounded-md border border-emerald-900/15 bg-emerald-50 px-4 py-3">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                <p className="text-xs leading-5 text-emerald-950">
                  Coaches can update their own profile, but Coach First decides what becomes
                  verified intelligence and what can be released into a club process.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
