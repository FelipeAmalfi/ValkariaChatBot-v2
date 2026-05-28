import type { AffinitySnapshot } from './AffinityEntry.js'
import type { PlayerRole } from '../value-objects/Role.js'

export interface SessionContext {
  threadId: string
  playerId?: string
  playerName?: string
  role: PlayerRole
  recentContext: string[]
  affinityContext: AffinitySnapshot[]
}
