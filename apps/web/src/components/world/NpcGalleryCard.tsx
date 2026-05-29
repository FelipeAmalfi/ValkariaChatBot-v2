'use client'
import { cn } from '@/lib/utils'
import { AffinityMeter } from '@/components/chat/AffinityMeter'

interface NpcGalleryCardProps {
  npc: { name: string; faction: string; role: string; location?: string }
  affinity?: { level: string; score: number }
}

const factionColors: Record<string, string> = {
  valkaria_order: 'border-l-blue-500',
  shadow_guild: 'border-l-purple-700',
  merchant_league: 'border-l-yellow-600',
  free_cities: 'border-l-green-700',
  neutral: 'border-l-gray-600',
}

const factionBadgeColors: Record<string, string> = {
  valkaria_order: 'bg-blue-500/20 text-blue-300',
  shadow_guild: 'bg-purple-700/20 text-purple-300',
  merchant_league: 'bg-yellow-600/20 text-yellow-300',
  free_cities: 'bg-green-700/20 text-green-300',
  neutral: 'bg-gray-600/20 text-gray-300',
}

const factionIconColors: Record<string, string> = {
  valkaria_order: '#3b82f6',
  shadow_guild: '#7e22ce',
  merchant_league: '#ca8a04',
  free_cities: '#15803d',
  neutral: '#4b5563',
}

const factionLabels: Record<string, string> = {
  valkaria_order: 'Ordem de Valkária',
  shadow_guild: 'Guilda das Sombras',
  merchant_league: 'Liga Mercante',
  free_cities: 'Cidades Livres',
  neutral: 'Neutro',
}

export function NpcGalleryCard({ npc, affinity }: NpcGalleryCardProps) {
  const borderColor = factionColors[npc.faction] ?? 'border-l-gray-600'
  const badgeColor = factionBadgeColors[npc.faction] ?? 'bg-gray-600/20 text-gray-300'
  const iconColor = factionIconColors[npc.faction] ?? '#4b5563'
  const factionLabel = factionLabels[npc.faction] ?? npc.faction

  return (
    <div
      className={cn(
        'bg-card border border-shadow border-l-2 rounded-lg p-4 flex flex-col gap-3',
        'transition-all duration-200 hover:-translate-y-1 hover:border-mist hover:shadow-lg',
        borderColor
      )}
    >
      <div className="flex items-center gap-3">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="shrink-0 rounded-md bg-void/50">
          <circle cx="32" cy="32" r="20" fill={iconColor} fillOpacity="0.2" />
          <circle cx="32" cy="26" r="8" fill={iconColor} fillOpacity="0.7" />
          <ellipse cx="32" cy="46" rx="14" ry="8" fill={iconColor} fillOpacity="0.5" />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-parchment text-sm font-semibold truncate">{npc.name}</h3>
          <p className="text-mist text-xs truncate">{npc.role}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={cn('px-2 py-0.5 text-xs rounded-full', badgeColor)}>{factionLabel}</span>
      </div>

      {npc.location && (
        <p className="text-silver text-xs">
          <span className="mr-1">📍</span>
          {npc.location}
        </p>
      )}

      {affinity && (
        <AffinityMeter level={affinity.level} />
      )}
    </div>
  )
}
