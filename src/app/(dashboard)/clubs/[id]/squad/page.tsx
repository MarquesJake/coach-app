'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  const loadSquad = useCallback(async () => {
    const supabase = createClient()
    const [{ data: squad }, { data: club }] = await Promise.all([
      supabase.from('club_squad').select('*').eq('club_id', id).order('number'),
      supabase.from('clubs').select('squad_synced_at').eq('id', id).single(),
    ])
    setPlayers((squad as Player[]) ?? [])
    setLastSynced(club?.squad_synced_at ?? null)
    setLoading(false)
  }, [id])

  useEffect(() => { loadSquad() }, [loadSquad])

  async function handleSync() {
    setSyncing(true)
    await fetch(`/api/integrations/clubs/sync-club/${id}`, { method: 'POST' })
    await loadSquad()
    setSyncing(false)
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
          {lastSynced && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Updated {new Date(lastSynced).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {syncing ? 'Syncing…' : 'Sync'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-sm text-muted-foreground">No squad data yet.</p>
          <button
            onClick={handleSync}
            disabled={syncing}
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
