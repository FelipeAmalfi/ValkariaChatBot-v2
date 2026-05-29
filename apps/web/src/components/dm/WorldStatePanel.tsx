'use client'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { cn } from '@/lib/utils'
import { LIST_ALL_PLAYERS } from '@/lib/graphql/queries/dm'
import { LIST_NPCS } from '@/lib/graphql/queries/world'

interface ListAllPlayersData {
  players: { id: string }[]
}

interface Npc {
  name: string
  faction: string
  location: string
}

interface ListNpcsData {
  npcs: Npc[]
}

const FACTIONS = [
  { id: 'valkaria_order', name: 'Ordem de Valkária', indicatorColor: 'bg-blue-500' },
  { id: 'shadow_guild', name: 'Guilda das Sombras', indicatorColor: 'bg-purple-500' },
  { id: 'merchant_league', name: 'Liga Mercante', indicatorColor: 'bg-yellow-500' },
  { id: 'free_cities', name: 'Cidades Livres', indicatorColor: 'bg-green-500' },
]

export function WorldStatePanel() {
  const { data: playersData } = useQuery<ListAllPlayersData>(LIST_ALL_PLAYERS, {
    variables: { page: 1, pageSize: 1 },
  })

  const { data: playersCountData } = useQuery<{ players: { id: string }[] }>(LIST_ALL_PLAYERS, {
    variables: { page: 1, pageSize: 1000 },
  })

  const { data: npcsData } = useQuery<ListNpcsData>(LIST_NPCS, {
    variables: { pageSize: 200 },
  })

  const locationCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const npc of npcsData?.npcs ?? []) {
      if (npc.location) {
        map[npc.location] = (map[npc.location] ?? 0) + 1
      }
    }
    return Object.entries(map)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
  }, [npcsData])

  const factionCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const npc of npcsData?.npcs ?? []) {
      if (npc.faction) {
        map[npc.faction] = (map[npc.faction] ?? 0) + 1
      }
    }
    return map
  }, [npcsData])

  const maxLocationCount = locationCounts[0]?.count ?? 1
  const totalPlayers = playersCountData?.players?.length ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* Registered Players */}
      <div className="bg-night/60 border border-shadow rounded-lg p-5">
        <h2 className="font-display text-gold text-sm uppercase tracking-widest mb-3">
          Jogadores
        </h2>
        <div className="w-8 h-px bg-gold/30 mb-4" />
        <p className="text-parchment text-2xl font-display">
          {totalPlayers > 0 ? totalPlayers : (playersData ? 0 : '...')}
        </p>
        <p className="text-silver text-xs mt-1">jogadores registrados</p>
      </div>

      {/* Location Activity */}
      <div className="bg-night/60 border border-shadow rounded-lg p-5">
        <h2 className="font-display text-gold text-sm uppercase tracking-widest mb-3">
          Atividade por Local
        </h2>
        <div className="w-8 h-px bg-gold/30 mb-4" />
        {locationCounts.length === 0 ? (
          <p className="text-silver text-xs">Nenhum dado disponível.</p>
        ) : (
          locationCounts.slice(0, 8).map(({ location, count }) => (
            <div key={location} className="flex items-center gap-2 mb-2">
              <span className="text-silver text-xs w-24 truncate" title={location}>
                {location}
              </span>
              <div className="flex-1 bg-shadow rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gold h-full rounded-full transition-all duration-500"
                  style={{ width: `${(count / maxLocationCount) * 100}%` }}
                />
              </div>
              <span className="text-silver text-xs w-6 text-right">{count}</span>
            </div>
          ))
        )}
      </div>

      {/* Faction Distribution */}
      <div className="bg-night/60 border border-shadow rounded-lg p-5">
        <h2 className="font-display text-gold text-sm uppercase tracking-widest mb-3">
          Distribuição por Facção
        </h2>
        <div className="w-8 h-px bg-gold/30 mb-4" />
        {FACTIONS.map(faction => (
          <div key={faction.id} className="flex items-center gap-2 mb-2">
            <div className={cn('w-3 h-3 rounded-sm', faction.indicatorColor)} />
            <span className="text-silver text-sm flex-1">{faction.name}</span>
            <span className="text-parchment text-sm">{factionCounts[faction.id] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
