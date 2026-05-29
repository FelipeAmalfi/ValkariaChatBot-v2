'use client'
import { motion } from 'framer-motion'

interface MessageBubbleProps {
  role: 'user' | 'narrator'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  if (role === 'narrator') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex gap-3 mb-4"
      >
        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
          <span className="text-gold text-xs">⚔</span>
        </div>
        <div className="flex-1 bg-night rounded-lg p-4 border border-shadow">
          <p className="text-silver text-xs mb-1 font-display">Narrador</p>
          <p className="text-parchment leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 mb-4 justify-end"
    >
      <div className="max-w-[80%] bg-shadow/50 rounded-lg p-4 border border-mist/30">
        <p className="text-silver/80 text-sm">{content}</p>
      </div>
    </motion.div>
  )
}
