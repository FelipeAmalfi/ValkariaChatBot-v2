'use client'
import { useMemo, useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { useAuth } from '@/lib/auth/AuthContext'
import { LIST_NPCS } from '@/lib/graphql/queries/world'
import { GET_MY_AFFINITIES, SET_AFFINITY } from '@/lib/graphql/queries/profile'
import { AffinityMeter } from '@/components/chat/AffinityMeter'

interface Npc { name: string; role: string; location?: string }
interface Affinity { npcName: string; level: string; score: number; interactionCount: number }

const SCORE_LABELS: Record<number, string> = {
  1: '1 — Cordial',
  2: '2 — Cordial',
  3: '3 — Cordial',
  4: '4 — Leal',
  5: '5 — Leal',
  6: '6 — Leal',
  7: '7 — Íntimo',
}

export function AffinityEditTable() {
  const { player } = useAuth()
  const [saving, setSaving] = useState<string | null>(null)

  const { data: npcsData, loading: npcsLoading } = useQuery<{ npcs: Npc[] }>(LIST_NPCS, {
    variables: { pageSize: 100 },
  })

  const { data: affinityData, refetch } = useQuery<{ affinities: Affinity[] }>(GET_MY_AFFINITIES, {
    variables: { playerName: player?.name },
    skip: !player,
  })

  const [setAffinity] = useMutation(SET_AFFINITY)

  const affinityMap = useMemo(() => {
    return Object.fromEntries((affinityData?.affinities ?? []).map(a => [a.npcName, a]))
  }, [affinityData])

  async function handleScoreChange(npcName: string, score: number) {
    if (!player?.name) return
    setSaving(npcName)
    try {
      await setAffinity({ variables: { playerName: player.name, npcName, score } })
      await refetch()
    } finally {
      setSaving(null)
    }
  }

  if (npcsLoading) return <div className="text-silver text-sm py-4 text-center">Carregando NPCs...</div>

  const npcs = npcsData?.npcs ?? []

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-shadow">
            <th className="text-left text-silver font-display text-xs py-2 pr-4">NPC</th>
            <th className="text-left text-silver font-display text-xs py-2 pr-4">Local</th>
            <th className="text-left text-silver font-display text-xs py-2 pr-4">Afinidade</th>
            <th className="text-left text-silver font-display text-xs py-2">Valor (1-7)</th>
          </tr>
        </thead>
        <tbody>
          {npcs.map(npc => {
            const aff = affinityMap[npc.name]
            const currentScore = Math.round(aff?.score ?? 0)
            const currentLevel = aff?.level ?? 'none'
            return (
              <tr key={npc.name} className="border-b border-shadow/30 hover:bg-void/20 transition-colors">
                <td className="py-2 pr-4 text-parchment/90 font-display text-xs">{npc.name}</td>
                <td className="py-2 pr-4 text-silver text-xs">{npc.location ?? '—'}</td>
                <td className="py-2 pr-4">
                  <AffinityMeter level={currentLevel} score={currentScore} />
                </td>
                <td className="py-2">
                  <select
                    value={currentScore}
                    onChange={e => handleScoreChange(npc.name, Number(e.target.value))}
                    disabled={saving === npc.name}
                    className="bg-night border border-shadow text-parchment text-xs rounded px-2 py-1 focus:outline-none focus:border-gold/40 disabled:opacity-50"
                  >
                    <option value={0}>0 — Neutro</option>
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <option key={n} value={n}>{SCORE_LABELS[n]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
