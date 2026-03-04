'use client'

import { Search } from 'lucide-react'

export function StaffListFilters({
  roles,
  initialQ,
  initialRole,
}: {
  roles: string[]
  initialQ?: string
  initialRole?: string
}) {
  return (
    <form method="get" action="/staff" className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={initialQ ?? ''}
          placeholder="Search by name..."
          className="h-9 pl-8 pr-3 rounded-lg border border-border bg-surface text-sm text-foreground placeholder-muted-foreground w-48 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search staff by name"
        />
      </div>
      <select
        name="role"
        defaultValue={initialRole ?? ''}
        className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-foreground min-w-[140px] focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Filter by primary role"
      >
        <option value="">All roles</option>
        {roles.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 px-3 rounded-lg border border-border bg-surface text-sm font-medium text-foreground hover:bg-surface-overlay/50 transition-colors"
      >
        Apply
      </button>
    </form>
  )
}
