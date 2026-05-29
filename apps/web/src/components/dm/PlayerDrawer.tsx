'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { NarrativeBlock } from '@/components/profile/NarrativeBlock'
import { PlayerAffinityTable } from './PlayerAffinityTable'
import type { PlayerProfile } from './DmDashboard'

interface PlayerDrawerProps {
  player: PlayerProfile | null
  onClose: () => void
}

export function PlayerDrawer({ player, onClose }: PlayerDrawerProps) {
  return (
    <>
      <AnimatePresence>
        {player && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-night border-l border-shadow shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl text-gold">{player.name}</h2>
                  <p className="text-silver text-sm mt-1">
                    {player.class} · {player.race}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-silver hover:text-gold transition-colors text-xl leading-none mt-1"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <NarrativeBlock title="Antecedente" content={player.background} />
                <NarrativeBlock title="Personalidade" content={player.personality} />
                <NarrativeBlock title="Interesses" content={player.interests} />
              </div>

              <div className="mt-6">
                <h3 className="font-display text-gold text-sm uppercase tracking-widest mb-3">
                  Afinidades com NPCs
                </h3>
                <div className="w-8 h-px bg-gold/30 mb-4" />
                <PlayerAffinityTable playerName={player.name} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {player && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/60 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    </>
  )
}
