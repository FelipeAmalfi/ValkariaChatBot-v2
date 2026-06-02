'use client'
import { cn } from '@/lib/utils'
import { AffinityMeter } from '@/components/chat/AffinityMeter'

interface NpcGalleryCardProps {
  npc: { name: string; role: string; location?: string }
  affinity?: { level: string; score: number }
}

export function NpcGalleryCard({ npc, affinity }: NpcGalleryCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-shadow rounded-lg p-4 flex flex-col gap-3',
        'transition-all duration-200 hover:-translate-y-1 hover:border-mist hover:shadow-lg',
      )}
    >
      <div className="flex items-center gap-3">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" className="shrink-0 rounded-md bg-void/50">
          <circle cx="32" cy="32" r="20" fill="#b8860b" fillOpacity="0.2" />
          <circle cx="32" cy="26" r="8" fill="#b8860b" fillOpacity="0.7" />
          <ellipse cx="32" cy="46" rx="14" ry="8" fill="#b8860b" fillOpacity="0.5" />
        </svg>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-parchment text-sm font-semibold truncate">{npc.name}</h3>
          <p className="text-mist text-xs truncate">{npc.role}</p>
        </div>
      </div>

      {npc.location && (
        <p className="text-silver text-xs">
          <span className="mr-1">📍</span>
          {npc.location}
        </p>
      )}

      {affinity && (
        <AffinityMeter level={affinity.level} score={affinity.score} />
      )}
    </div>
  )
}
