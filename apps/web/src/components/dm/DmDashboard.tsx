'use client'
import { useState } from 'react'
import { PlayerTable } from './PlayerTable'
import { PlayerDrawer } from './PlayerDrawer'
import { WorldStatePanel } from './WorldStatePanel'

export interface PlayerProfile {
  id: string
  name: string
  class: string
  race: string
  background?: string
  personality?: string
  interests?: string
  createdAt: string
}

export function DmDashboard() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-gold text-2xl">🎲</span>
        <h1 className="font-display text-3xl text-gold">Painel do Mestre</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PlayerTable onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
        </div>
        <div>
          <WorldStatePanel />
        </div>
      </div>

      <PlayerDrawer
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  )
}
