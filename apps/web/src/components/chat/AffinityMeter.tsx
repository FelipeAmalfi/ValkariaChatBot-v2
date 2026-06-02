'use client'
import { cn } from '@/lib/utils'

const LEVEL_LABELS: Record<string, string> = {
  none: 'Neutro',
  cordial: 'Cordial',
  loyal: 'Leal',
  intimate: 'Íntimo',
}

const LEVEL_COLORS: Record<string, string> = {
  none: 'bg-mist/60',
  cordial: 'bg-sage',
  loyal: 'bg-gold/60',
  intimate: 'bg-gold',
}

export function AffinityMeter({ level, score }: { level: string; score?: number }) {
  const color = LEVEL_COLORS[level] ?? 'bg-mist/60'
  const label = LEVEL_LABELS[level] ?? level
  const filled = score ?? 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-sm transition-all',
              i < filled ? color : 'bg-mist/20'
            )}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-silver tabular-nums">
        {filled > 0 ? filled : '—'}<span className="text-mist/50">/7</span>
      </span>
      <span className="text-xs text-mist/70 capitalize">{label}</span>
    </div>
  )
}
