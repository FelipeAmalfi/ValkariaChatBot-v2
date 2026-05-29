'use client'
import { useQuery } from '@apollo/client/react'
import { GET_NPC, GET_AFFINITY } from '@/lib/graphql/queries/npc'
import { useAuth } from '@/lib/auth/AuthContext'
import { NpcCard } from './NpcCard'

interface NpcMetadata {
  likes?: string[]
  dislikes?: string[]
  benefitsCordial?: string
  benefitsLoyal?: string
  benefitsIntimate?: string
}

interface Npc {
  name: string
  faction: string
  role: string
  location?: string
  metadata?: NpcMetadata
}

interface NpcQueryResult {
  npc: Npc | null
}

interface AffinityQueryResult {
  affinity: { level: string; score: number } | null
}

interface WorldContextPanelProps {
  activeNpc: string | null
}

export function WorldContextPanel({ activeNpc }: WorldContextPanelProps) {
  const { player } = useAuth()

  const { data: npcData } = useQuery<NpcQueryResult>(GET_NPC, {
    variables: { name: activeNpc },
    skip: !activeNpc,
  })

  const { data: affinityData } = useQuery<AffinityQueryResult>(GET_AFFINITY, {
    variables: { playerName: player?.name, npcName: activeNpc },
    skip: !activeNpc || !player,
  })

  const npc = npcData?.npc ?? null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gold/20 flex-shrink-0">
        <h2 className="font-display text-gold text-sm uppercase tracking-widest">
          Contexto do Mundo
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!activeNpc || !npc ? (
          <div className="p-6 space-y-3">
            <h3 className="font-display text-gold/70 text-sm">O mundo de Candessah</h3>
            <p className="text-silver/60 text-xs leading-relaxed">
              Um reino de sombras e mistérios, onde facções rivais disputam o poder e
              antigas profecias moldam o destino dos mortais. Cada NPC que você encontrar
              aparecerá aqui com seus segredos revelados.
            </p>
            <div className="mt-4 pt-4 border-t border-shadow/40">
              <p className="text-mist/40 text-xs italic">
                Inicie uma conversa para revelar o mundo...
              </p>
            </div>
          </div>
        ) : (
          <NpcCard npc={npc} affinity={affinityData?.affinity ?? undefined} />
        )}
      </div>
    </div>
  )
}
