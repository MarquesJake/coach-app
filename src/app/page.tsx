import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { PORTAL_ENTRIES, portalLoginHref } from '@/lib/organizations/portal-entry'

export default async function Home({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <div className="min-h-screen bg-background text-foreground">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Zap className="h-5 w-5"/></span><span className="text-xl font-semibold tracking-tight">Gaffa</span></Link><div className="flex items-center gap-4"><ThemeToggle/><Link className="gaffa-link" href={portalLoginHref('internal', next)}>Sign in<ArrowUpRight className="ml-1 inline h-3.5 w-3.5"/></Link></div></header>
    <main className="mx-auto max-w-7xl px-6 pb-12 pt-14 sm:px-10 sm:pt-24">
      <section className="grid gap-10 border-b border-border pb-16 lg:grid-cols-[1.6fr_1fr] lg:items-end lg:gap-20"><div><p className="gaffa-eyebrow mb-6">Coach research &amp; appointments</p><h1 className="max-w-3xl text-5xl font-medium leading-[1.04] tracking-[-0.05em] sm:text-7xl lg:text-8xl">Know the coach.<br/><span className="text-primary">Make a better appointment.</span></h1></div><div className="pb-2"><p className="max-w-md text-lg leading-relaxed text-muted-foreground">Bring the club brief, coach research and appointment decision together. Keep the evidence, open questions and next steps in view.</p><a className="gaffa-action gaffa-action-primary mt-8 !min-h-12 !px-6" href="#workspaces">Choose your workspace<ArrowRight className="h-4 w-4"/></a></div></section>
      <section id="workspaces" className="scroll-mt-6 border-b border-border py-10">
        <h2 className="font-serif text-2xl">Sign in to your workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use the workspace named in your invitation.</p>
        <nav aria-label="Workspace sign in" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{PORTAL_ENTRIES.map(entry => <Link key={entry.id} href={portalLoginHref(entry.id, next)} className="flex items-center justify-between rounded-md border border-border bg-card p-5 text-sm font-semibold hover:bg-secondary/30">{entry.label}<ArrowRight className="h-4 w-4" /></Link>)}</nav>
      </section>
      <section aria-label="What Gaffa brings together" className="grid gap-10 py-12 md:grid-cols-3 md:gap-16">{[
        ['01','The appointment','From club brief to board report. Keep requirements, candidates and decisions connected.'],
        ['02','The person behind the profile','Research football, career and leadership with findings linked to their sources.'],
        ['03','The next step','See what needs attention, who is responsible and what still needs checking.'],
      ].map(([number,title,description])=><div key={number}><span className="text-xs font-medium text-primary">{number}</span><h2 className="mb-3 mt-4 text-xl font-semibold tracking-tight">{title}</h2><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p></div>)}</section>
    </main>
  </div>
}
