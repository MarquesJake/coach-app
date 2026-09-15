import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LISTED_PORTAL_ENTRIES, portalLoginHref } from '@/lib/organizations/portal-entry'

export default async function Home({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <div className="min-h-screen bg-background text-foreground">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-10"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Zap className="h-5 w-5"/></span><span className="text-xl font-semibold tracking-tight">Gaffa</span></Link><div className="flex items-center gap-4"><ThemeToggle/><Link className="gaffa-link" href={portalLoginHref('internal', next)}>Sign in<ArrowUpRight className="ml-1 inline h-3.5 w-3.5"/></Link></div></header>
    <main className="mx-auto max-w-7xl px-6 pb-12 pt-14 sm:px-10 sm:pt-24">
      <section className="grid gap-10 border-b border-border pb-16 lg:grid-cols-[1.6fr_1fr] lg:items-end lg:gap-20"><div><p className="gaffa-eyebrow mb-6">Head coach appointments</p><h1 className="max-w-3xl text-5xl font-medium leading-[1.04] tracking-[-0.05em] sm:text-7xl lg:text-8xl">Get the next<br/><span className="text-primary">manager right.</span></h1></div><div className="pb-2"><p className="max-w-md text-lg leading-relaxed text-muted-foreground">Set out the football you want, see which coaches genuinely fit it and why, and take the board a shortlist you can stand behind.</p><a className="gaffa-action gaffa-action-primary mt-8 !min-h-12 !px-6" href="#workspaces">Pick your door<ArrowRight className="h-4 w-4"/></a></div></section>
      <section id="workspaces" className="scroll-mt-6 border-b border-border py-10">
        <h2 className="font-serif text-2xl">Sign in</h2>
        <p className="mt-2 text-sm text-muted-foreground">Use the door on your invitation.</p>
        <nav aria-label="Workspace sign in" className="mt-6 grid gap-3 sm:grid-cols-3">{LISTED_PORTAL_ENTRIES.map(entry => <Link key={entry.id} href={portalLoginHref(entry.id, next)} className="flex items-center justify-between rounded-md border border-border bg-card p-5 text-sm font-semibold hover:bg-secondary/30">{entry.label}<ArrowRight className="h-4 w-4" /></Link>)}</nav>
      </section>
      <section aria-label="What Gaffa brings together" className="grid gap-10 py-12 md:grid-cols-3 md:gap-16">{[
        ['01','The brief','How you want to play, what the job needs and what you can spend — agreed before a single name comes up.'],
        ['02','The shortlist','Every coach ranked against that brief on his football, his record and his match data, with the reasons shown.'],
        ['03','The call','Who is realistic, what we still need to find out, and a report the board can read in ten minutes.'],
      ].map(([number,title,description])=><div key={number}><span className="text-xs font-medium text-primary">{number}</span><h2 className="mb-3 mt-4 text-xl font-semibold tracking-tight">{title}</h2><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p></div>)}</section>
    </main>
  </div>
}
