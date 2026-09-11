export function DemoNotice() {
  if (process.env.DEMO_MODE !== 'true') return null
  return (
    <aside aria-label="Demo workspace" className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 print:hidden">
      <strong>Investor demo workspace.</strong> Use sample information only. Live data integrations and application invitation emails are disabled.
    </aside>
  )
}
