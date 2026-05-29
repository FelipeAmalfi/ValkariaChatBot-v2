'use client'
import { Badge } from '@/components/ui/badge'

interface CharacterHeaderProps {
  player: { name: string; class: string; race: string } | null
}

export function CharacterHeader({ player }: CharacterHeaderProps) {
  return (
    <div className="text-center border-b border-gold/30 pb-6">
      <h1 className="font-display text-4xl text-gold mb-2">{player?.name}</h1>
      <p className="text-silver text-lg">{player?.class} • {player?.race}</p>
      <div className="flex justify-center gap-2 mt-3">
        <Badge className="bg-shadow text-parchment border-shadow">{player?.class}</Badge>
        <Badge className="bg-shadow text-parchment border-shadow">{player?.race}</Badge>
      </div>
      <div className="flex items-center gap-4 mt-6 text-gold/40">
        <div className="flex-1 h-px bg-gold/20" />
        <span className="text-gold">⚔</span>
        <div className="flex-1 h-px bg-gold/20" />
      </div>
    </div>
  )
}
