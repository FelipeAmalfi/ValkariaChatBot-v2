'use client'
import { useQuery } from '@apollo/client/react'
import { AnimatePresence, motion } from 'framer-motion'
import { LIST_NPCS } from '@/lib/graphql/queries/world'

interface LocationNpc {
  name: string
  role: string
}

interface ListNpcsData {
  npcs: LocationNpc[]
}

interface Location {
  id: string
  name: string
  description: string
  services: string[]
}

interface LocationCardProps {
  location: Location
  isExpanded: boolean
  onToggle: () => void
}

export function LocationCard({ location, isExpanded, onToggle }: LocationCardProps) {
  const { data: npcsData } = useQuery<ListNpcsData>(LIST_NPCS, {
    variables: { location: location.name, pageSize: 10 },
    skip: !isExpanded,
  })

  return (
    <div className="bg-card border border-shadow rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-shadow/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gold font-display text-base">{location.name}</span>
          <div className="flex gap-1 flex-wrap">
            {location.services?.map(service => (
              <span key={service} className="px-2 py-0.5 bg-shadow text-silver text-xs rounded-full">
                {service}
              </span>
            ))}
          </div>
        </div>
        <span className="text-mist text-sm shrink-0 ml-2">{isExpanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-shadow/50">
              <p className="text-silver text-sm pt-3">{location.description}</p>
              {(npcsData?.npcs?.length ?? 0) > 0 && (
                <div>
                  <p className="text-mist text-xs uppercase tracking-wider mb-2">Personagens</p>
                  <div className="flex flex-wrap gap-2">
                    {npcsData?.npcs.map((npc) => (
                      <span key={npc.name} className="px-2 py-0.5 bg-void border border-shadow text-parchment text-xs rounded-full">
                        {npc.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
