'use client'
import { useState } from 'react'
import { useLazyQuery } from '@apollo/client/react'
import { AnimatePresence, motion } from 'framer-motion'
import { AffinityMeter } from '@/components/chat/AffinityMeter'
import { GET_NPC_DETAILS } from '@/lib/graphql/queries/profile'

interface AffinityNpcCardProps {
  npcName: string
  level: string
  score: number
  interactionCount: number
}

const levelOrder = ['cordial', 'loyal', 'intimate'] as const

export function AffinityNpcCard({ npcName, level, score, interactionCount }: AffinityNpcCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [fetchDetails, { data }] = useLazyQuery<{
    npc: {
      name: string
      faction: string
      role: string
      location: string
      metadata: { benefitsCordial: string; benefitsLoyal: string; benefitsIntimate: string }
    }
  }>(GET_NPC_DETAILS)

  function handleToggle() {
    if (!isExpanded && !data) {
      fetchDetails({ variables: { name: npcName } })
    }
    setIsExpanded((prev) => !prev)
  }

  const npc = data?.npc
  const benefits = {
    cordial: npc?.metadata?.benefitsCordial,
    loyal: npc?.metadata?.benefitsLoyal,
    intimate: npc?.metadata?.benefitsIntimate,
  }
  const currentIdx = levelOrder.indexOf(level as (typeof levelOrder)[number])

  return (
    <div
      className="bg-night/60 border border-shadow rounded-lg p-4 cursor-pointer hover:border-gold/30 transition-colors"
      onClick={handleToggle}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-parchment text-sm">{npcName}</span>
        <span className="text-mist/50 text-xs">{interactionCount} interações</span>
      </div>
      <div className="mt-2">
        <AffinityMeter level={level} />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-shadow/40 space-y-1">
              {levelOrder.map((tier, idx) => (
                <div
                  key={tier}
                  className={`flex items-start gap-2 text-sm py-1 ${
                    idx <= currentIdx ? 'text-parchment' : 'text-mist'
                  }`}
                >
                  <span>{idx <= currentIdx ? '✓' : '🔒'}</span>
                  <span className="capitalize font-display text-xs text-gold/60 shrink-0">{tier}:</span>
                  <span className="text-xs leading-relaxed">
                    {benefits[tier] ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
