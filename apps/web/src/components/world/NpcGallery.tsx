'use client'
import { useState, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { useAuth } from '@/lib/auth/AuthContext'
import { LIST_NPCS, GET_AFFINITIES } from '@/lib/graphql/queries/world'
import { NpcFilter } from './NpcFilter'
import { NpcGalleryCard } from './NpcGalleryCard'

interface Filters {
  location: string
  faction: string
  page: number
}

interface Npc {
  name: string
  faction: string
  role: string
  location?: string
}

interface Affinity {
  npcName: string
  level: string
  score: number
}

interface ListNpcsData {
  npcs: Npc[]
}

interface GetAffinitiesData {
  affinities: Affinity[]
}

export function NpcGallery() {
  const [filters, setFilters] = useState<Filters>({ location: '', faction: '', page: 1 })
  const { player } = useAuth()

  const { data: npcsData, loading } = useQuery<ListNpcsData>(LIST_NPCS, {
    variables: { ...filters, pageSize: 20 },
  })

  const { data: affinityData } = useQuery<GetAffinitiesData>(GET_AFFINITIES, {
    variables: { playerName: player?.name },
    skip: !player,
  })

  const affinityMap = useMemo(() => {
    return Object.fromEntries(
      (affinityData?.affinities ?? []).map(a => [a.npcName, a])
    )
  }, [affinityData])

  return (
    <div className="flex gap-6">
      <NpcFilter value={filters} onChange={setFilters} />
      <div className="flex-1">
        {loading ? (
          <div className="text-silver text-center py-12">Carregando personagens...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {npcsData?.npcs.map(npc => (
              <NpcGalleryCard
                key={npc.name}
                npc={npc}
                affinity={affinityMap[npc.name]}
              />
            ))}
          </div>
        )}
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page === 1}
            className="px-4 py-2 bg-night border border-shadow rounded disabled:opacity-30"
          >
            ←
          </button>
          <span className="px-4 py-2 text-silver">Página {filters.page}</span>
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            disabled={(npcsData?.npcs.length ?? 0) < 20}
            className="px-4 py-2 bg-night border border-shadow rounded disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
