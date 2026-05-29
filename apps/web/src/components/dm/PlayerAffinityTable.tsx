'use client'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { cn } from '@/lib/utils'
import { GET_PLAYER_AFFINITIES } from '@/lib/graphql/queries/dm'

interface Affinity {
  npcName: string
  level: string
  score: number
  interactionCount: number
  lastInteraction?: string
}

interface GetPlayerAffinitiesData {
  affinities: Affinity[]
}

interface PlayerAffinityTableProps {
  playerName: string
}

const affinityOrder: Record<string, number> = { intimate: 0, loyal: 1, cordial: 2, none: 3 }

const levelColors: Record<string, string> = {
  intimate: 'text-gold',
  loyal: 'text-yellow-600',
  cordial: 'text-sage',
  none: 'text-mist',
}

const levelLabels: Record<string, string> = {
  intimate: 'Íntimo',
  loyal: 'Leal',
  cordial: 'Cordial',
  none: 'Neutro',
}

const formatDate = (iso?: string) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))
}

export function PlayerAffinityTable({ playerName }: PlayerAffinityTableProps) {
  const { data, loading } = useQuery<GetPlayerAffinitiesData>(GET_PLAYER_AFFINITIES, {
    variables: { playerName },
  })

  const sorted = useMemo(() => {
    return [...(data?.affinities ?? [])].sort((a, b) => {
      const levelDiff = (affinityOrder[a.level] ?? 3) - (affinityOrder[b.level] ?? 3)
      if (levelDiff !== 0) return levelDiff
      return b.score - a.score
    })
  }, [data])

  if (loading) {
    return <div className="text-silver text-sm text-center py-4">Carregando afinidades...</div>
  }

  if (sorted.length === 0) {
    return <div className="text-mist text-sm text-center py-4">Nenhuma afinidade registrada.</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-shadow">
            <th className="text-left text-silver font-display text-xs py-2 pr-3">NPC</th>
            <th className="text-left text-silver font-display text-xs py-2 pr-3">Nível</th>
            <th className="text-left text-silver font-display text-xs py-2 pr-3">Pontos</th>
            <th className="text-left text-silver font-display text-xs py-2 pr-3">Interações</th>
            <th className="text-left text-silver font-display text-xs py-2">Último Contato</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(a => (
            <tr key={a.npcName} className="border-b border-shadow/30">
              <td className="py-2 pr-3 text-parchment/90">{a.npcName}</td>
              <td className={cn('py-2 pr-3 font-semibold', levelColors[a.level] ?? 'text-mist')}>
                {levelLabels[a.level] ?? a.level}
              </td>
              <td className="py-2 pr-3 text-parchment/70">{a.score.toFixed(2)}</td>
              <td className="py-2 pr-3 text-parchment/70">{a.interactionCount}</td>
              <td className="py-2 text-silver">{formatDate(a.lastInteraction)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
