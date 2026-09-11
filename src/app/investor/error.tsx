'use client'
export default function InvestorError() {
  return <main role="alert" className="mx-auto max-w-xl space-y-4 px-6 py-12"><h1 className="font-serif text-3xl">Your workspace could not load</h1><p>Your saved workspace and current access could not be confirmed. Reload to check the saved version before making further edits. Unsaved changes may not be available. If access still needs attention, contact your presenter.</p><button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded bg-primary px-4 py-2 text-primary-foreground">Reload workspace</button></main>
}
