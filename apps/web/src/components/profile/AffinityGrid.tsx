'use client'
import { AffinityNpcCard } from './AffinityNpcCard'

interface Affinity {
  npcName: string
  level: string
  score: number
  interactionCount: number
}

interface AffinityGridProps {
  affinities: Affinity[]
}

const levelGroups: { key: string; label: string; color: string }[] = [
  { key: 'intimate', label: '● Íntimo', color: 'text-gold' },
  { key: 'loyal', label: '◕ Leal', color: 'text-gold/70' },
  { key: 'cordial', label: '◑ Cordial', color: 'text-sage' },
  { key: 'none', label: '○ Sem afinidade', color: 'text-mist' },
]

export function AffinityGrid({ affinities }: AffinityGridProps) {
  const showGroups = affinities.length > 5

  return (
    <div className="mt-10">
      <div className="flex items-center gap-4 mb-6 text-gold/40">
        <div className="flex-1 h-px bg-gold/20" />
        <span className="font-display text-gold text-lg tracking-widest">Relações</span>
        <div className="flex-1 h-px bg-gold/20" />
      </div>

      {affinities.length === 0 ? (
        <div className="border border-shadow/40 rounded-lg p-8 text-center">
          <p className="text-mist/70 italic text-sm">
            Ainda não cultivou relações em Candessah.
          </p>
        </div>
      ) : showGroups ? (
        <div className="space-y-8">
          {levelGroups.map(({ key, label, color }) => {
            const group = affinities.filter((a) => a.level === key)
            if (group.length === 0) return null
            return (
              <div key={key}>
                <p className={`font-display text-xs uppercase tracking-widest mb-3 ${color}`}>
                  {label}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.map((a) => (
                    <AffinityNpcCard key={a.npcName} {...a} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {affinities.map((a) => (
            <AffinityNpcCard key={a.npcName} {...a} />
          ))}
        </div>
      )}
    </div>
  )
}
