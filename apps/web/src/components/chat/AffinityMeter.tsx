'use client'
import { cn } from '@/lib/utils'

export function AffinityMeter({ level }: { level: string }) {
  const levels = ['none', 'cordial', 'loyal', 'intimate']
  const filled = levels.indexOf(level)

  const colors: Record<string, string> = {
    none: 'bg-mist',
    cordial: 'bg-sage',
    loyal: 'bg-gold-dim',
    intimate: 'bg-gold',
  }
  const color = colors[level] ?? 'bg-mist'

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {levels.map((_, i) => (
          <div
            key={i}
            className={cn('w-2 h-2 rounded-full transition-all', i <= filled ? color : 'bg-mist/30')}
          />
        ))}
      </div>
      <span className="text-xs text-silver capitalize">{level}</span>
    </div>
  )
}
