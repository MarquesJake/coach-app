'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useClubLoad } from '../../_components/use-club-load'
import { assertRouteQueries } from '@/lib/coaches/route-audit'
import { Loader2, RefreshCw, User } from 'lucide-react'

type Player = {
  id: string
  player_id: number
  name: string
  age: number | null
  position: string | null
  number: number | null
  photo_url: string | null
}

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

function groupByPosition(players: Player[]): Record<string, Player[]> {
  const groups: Record<string, Player[]> = {}
  for (const p of players) {
    const pos = p.position ?? 'Unknown'
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(p)
  }
  for (const pos in groups) {
    groups[pos].sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  }
  return groups
}

export default function ClubSquadPage() {
  const params = useParams()
  const id = params.id as string
  return <SquadContent key={id} id={id} />
}

function SquadContent({ id }: { id: string }) {
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const syncLock = useRef(false)
  const { data, loading, error, retry } = useClubLoad(id, async () => {
    const supabase = createClient()
    const [{ data: squad, error: squadError }, { data: club, error: clubError }] = await Promise.all([
      supabase.from('club_squad').select('*').eq('club_id', id).order('number'),
      supabase.from('clubs').select('squad_synced_at').eq('id', id).single(),
    ])
    assertRouteQueries('Squad records', { error: squadError }, { error: clubError })
    if (!club) throw new Error('Club unavailable')
    return { players: (squad as Player[]) ?? [], lastSynced: club.squad_synced_at }
  }, 'Squad records could not be loaded. Retry loading before relying on this view.')
  const players = data?.players ?? []
  const lastSynced = data?.lastSynced

  async function handleSync() {
    if (syncLock.current) return
    syncLock.current = true
    setSyncing(true)
    setSyncError(null)
    try {
      const response = await fetch(`/api/integrations/clubs/sync-club/${id}`, { method: 'POST' })
      const body = await response.json()
      if (!response.ok || !body.ok || body.error || body.coach_profile_errors?.length) throw new Error('Sync incomplete')
      retry()
    } catch {
      setSyncError('Sync could not be confirmed or completed. Reload records to check for partial updates before retrying sync.')
    } finally { syncLock.current = false; setSyncing(false) }
  }

  const groups = groupByPosition(players)
  const orderedPositions = [
    ...POSITION_ORDER.filter(p => groups[p]),
    ...Object.keys(groups).filter(p => !POSITION_ORDER.includes(p)),
  ]

  return (
    <div className="space-y-5 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Current Squad</h2>
          {!loading && !error && lastSynced && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Updated {new Date(lastSynced).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {syncError && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{syncError}</p><button onClick={retry} className="underline">Reload records</button></div>}
      {error ? <div role="alert" className="space-y-2 text-sm"><p>{error}</p><button onClick={retry} className="underline">Retry loading squad</button></div> : loading ? (
        <div role="status" aria-label="Loading squad" className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-muted-foreground">No squad data yet.</p>
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="inline-flex items-center gap-2 px-4 h-9 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Pull squad from API
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedPositions.map(pos => (
            <div key={pos}>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
                {pos}s <span className="text-muted-foreground/50">({groups[pos].length})</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {groups[pos].map(player => (
                  <div key={player.id} className="card-surface rounded-lg p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-surface border border-border flex items-center justify-center">
                      {player.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate leading-tight">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {[player.number ? `#${player.number}` : null, player.age ? `Age ${player.age}` : null].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
