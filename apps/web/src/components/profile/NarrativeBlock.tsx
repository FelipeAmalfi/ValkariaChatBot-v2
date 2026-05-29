'use client'
import { cn } from '@/lib/utils'

interface NarrativeBlockProps {
  title: string
  content?: string
  className?: string
}

export function NarrativeBlock({ title, content, className }: NarrativeBlockProps) {
  return (
    <div className={cn('bg-night/60 rounded-lg border border-shadow p-5', className)}>
      <h3 className="font-display text-gold text-sm uppercase tracking-widest mb-3">{title}</h3>
      <div className="w-8 h-px bg-gold/30 mb-4" />
      <p className="text-parchment/90 leading-relaxed text-sm">{content ?? '—'}</p>
    </div>
  )
}
