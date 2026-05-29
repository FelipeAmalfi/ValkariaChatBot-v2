'use client'
import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { useAuth } from '@/lib/auth/AuthContext'
import { GET_MY_AFFINITIES } from '@/lib/graphql/queries/profile'
import { CharacterHeader } from './CharacterHeader'
import { NarrativeBlock } from './NarrativeBlock'
import { AffinityGrid } from './AffinityGrid'

const affinityOrder: Record<string, number> = { intimate: 0, loyal: 1, cordial: 2, none: 3 }

export function CharacterSheet() {
  const { player } = useAuth()
  const { data } = useQuery<{ affinities: { npcName: string; level: string; score: number; interactionCount: number }[] }>(GET_MY_AFFINITIES, {
    variables: { playerName: player?.name },
    skip: !player,
  })

  const sortedAffinities = useMemo(() => {
    return [...(data?.affinities ?? [])].sort((a, b) => {
      const levelDiff =
        (affinityOrder[a.level] ?? 3) - (affinityOrder[b.level] ?? 3)
      if (levelDiff !== 0) return levelDiff
      return b.score - a.score
    })
  }, [data])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <CharacterHeader player={player} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <NarrativeBlock title="Antecedente" content={player?.background} />
        <NarrativeBlock title="Personalidade" content={player?.personality} />
        <NarrativeBlock title="Interesses" content={player?.interests} className="md:col-span-2" />
      </div>
      <AffinityGrid affinities={sortedAffinities} />
    </div>
  )
}
