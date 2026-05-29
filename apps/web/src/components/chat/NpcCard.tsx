'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AffinityMeter } from './AffinityMeter'

interface NpcMetadata {
  likes?: string[]
  dislikes?: string[]
  benefitsCordial?: string
  benefitsLoyal?: string
  benefitsIntimate?: string
}

interface NpcCardProps {
  npc: {
    name: string
    faction: string
    role: string
    location?: string
    metadata?: NpcMetadata
  }
  affinity?: { level: string; score: number }
}

const FACTION_COLORS: Record<string, string> = {
  'Guarda Real':     'bg-gold/20 text-gold border-gold/40',
  'Círculo Arcano':  'bg-valkaria-500/20 text-valkaria-300 border-valkaria-500/40',
  'Mercadores':      'bg-sage/20 text-sage border-sage/40',
  'Culto das Sombras': 'bg-ember/20 text-ember border-ember/40',
}

const DEFAULT_FACTION_COLOR = 'bg-mist/20 text-silver border-mist/40'

export function NpcCard({ npc, affinity }: NpcCardProps) {
  const [expanded, setExpanded] = useState(false)

  const factionColor = FACTION_COLORS[npc.faction] ?? DEFAULT_FACTION_COLOR

  const currentBenefit = affinity
    ? ({
        cordial: npc.metadata?.benefitsCordial,
        loyal: npc.metadata?.benefitsLoyal,
        intimate: npc.metadata?.benefitsIntimate,
      } as Record<string, string | undefined>)[affinity.level]
    : null

  const hasDetails =
    (npc.metadata?.likes?.length ?? 0) > 0 ||
    (npc.metadata?.dislikes?.length ?? 0) > 0

  return (
    <div className="p-4 space-y-3">
      {/* Name + faction */}
      <div className="space-y-2">
        <h3 className="text-gold font-display text-lg leading-tight">{npc.name}</h3>
        <div className="flex flex-wrap gap-2">
          <span className={cn('text-xs px-2 py-0.5 rounded-full border', factionColor)}>
            {npc.faction}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full border bg-shadow/30 text-silver border-shadow">
            {npc.role}
          </span>
        </div>
      </div>

      {/* Location */}
      {npc.location && (
        <div className="flex items-center gap-1.5 text-xs text-silver/70">
          <span>📍</span>
          <span>{npc.location}</span>
        </div>
      )}

      {/* Affinity */}
      {affinity && (
        <div className="space-y-1">
          <p className="text-xs text-silver/50 uppercase tracking-wider">Afinidade</p>
          <AffinityMeter level={affinity.level} />
        </div>
      )}

      {/* Current affinity benefit */}
      {currentBenefit && (
        <div className="text-xs bg-shadow/20 rounded p-2 border border-shadow/40">
          <p className="text-silver/50 uppercase tracking-wider mb-1">Benefício atual</p>
          <p className="text-parchment/80">{currentBenefit}</p>
        </div>
      )}

      {/* Expandable likes/dislikes */}
      {hasDetails && (
        <div>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-gold/60 hover:text-gold transition-colors flex items-center gap-1"
          >
            <span>{expanded ? '▲' : '▼'}</span>
            <span>{expanded ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
          </button>
          {expanded && (
            <div className="mt-2 space-y-2 text-xs">
              {(npc.metadata?.likes?.length ?? 0) > 0 && (
                <div>
                  <p className="text-silver/50 uppercase tracking-wider mb-1">Aprecia</p>
                  <ul className="space-y-0.5">
                    {npc.metadata!.likes!.map((item, i) => (
                      <li key={i} className="text-parchment/70">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(npc.metadata?.dislikes?.length ?? 0) > 0 && (
                <div>
                  <p className="text-silver/50 uppercase tracking-wider mb-1">Rejeita</p>
                  <ul className="space-y-0.5">
                    {npc.metadata!.dislikes!.map((item, i) => (
                      <li key={i} className="text-parchment/70">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
