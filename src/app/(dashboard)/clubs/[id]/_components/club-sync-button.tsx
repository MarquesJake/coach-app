'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { toastSuccess, toastError } from '@/lib/ui/toast'

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

type Props = {
  clubId: string
  hasExternalSource: boolean
  lastSyncedAt: string | null
  autoSync?: boolean
}

export function ClubSyncButton({ clubId, hasExternalSource, lastSyncedAt, autoSync }: Props) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{
    seasons_added: number
    seasons_updated: number
    manager_added: boolean
  } | null>(null)

  async function doSync() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/integrations/clubs/enrich/${clubId}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        toastError(json.error ?? 'Sync failed')
      } else {
        const { seasons_added, seasons_updated, manager_added } = json.synced
        setResult({ seasons_added, seasons_updated, manager_added })
        const parts: string[] = []
        if (seasons_added > 0) parts.push(`${seasons_added} season${seasons_added !== 1 ? 's' : ''} imported`)
        if (seasons_updated > 0) parts.push(`${seasons_updated} season${seasons_updated !== 1 ? 's' : ''} updated`)
        if (manager_added) parts.push('manager added')
        toastSuccess(`Synced${parts.length > 0 ? ` — ${parts.join(', ')}` : ''}`)
        router.refresh()
      }
    } catch {
      toastError('Sync failed')
    }
    setSyncing(false)
  }

  useEffect(() => {
    if (autoSync && lastSyncedAt === null) {
      doSync()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasExternalSource) return null

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={doSync}
        disabled={syncing}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 h-8 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing…' : 'Sync'}
      </button>
      {lastSyncedAt && !result && (
        <span className="text-[10px] text-muted-foreground/60">Synced {relTime(lastSyncedAt)}</span>
      )}
      {result && (
        <span className="text-[10px] text-emerald-400/70">Synced just now</span>
      )}
    </div>
  )
}
