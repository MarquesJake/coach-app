import Link from 'next/link'
import { ArrowRight, ShieldCheck, Target, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed right-6 top-6 z-10" />
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Coach First</p>
            <p className="mt-1 text-[10px] uppercase text-muted-foreground">Intelligence OS</p>
          </div>
        </div>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex rounded-md border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              Mandates, dossiers, agents, alerts
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
              Manager search with board level memory.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              Run mandate delivery, coach intelligence, risk signals, and relationship tracking from one operating surface.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-md)]">
            <div className="grid gap-2">
              {[
                { icon: Target, label: 'Active mandates', value: 'Board ready shortlists' },
                { icon: ShieldCheck, label: 'Risk memory', value: 'Confidence and source trails' },
                { icon: Zap, label: 'Next action layer', value: 'Alerts before drift happens' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-md border border-border bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">{label}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
