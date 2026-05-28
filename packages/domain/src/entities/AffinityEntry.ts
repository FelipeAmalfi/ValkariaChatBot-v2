import type { AffinityLevel } from '../value-objects/AffinityLevel.js'

export type { AffinityLevel }

export interface AffinityEntry {
  id: string
  playerId: string
  npcName: string
  level: AffinityLevel
  score: number
  interactionCount: number
  lastInteraction: string | null
}

export interface AffinitySnapshot {
  npcName: string
  level: AffinityLevel
  score: number
}
