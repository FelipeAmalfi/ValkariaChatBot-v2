import type { AffinityEntry } from '../entities/AffinityEntry.js'

export interface AffinityRepository {
  findByPlayerAndNpc(playerId: string, npcName: string): Promise<AffinityEntry | null>
  findByPlayer(playerId: string): Promise<AffinityEntry[]>
  upsert(entry: Omit<AffinityEntry, 'id'>): Promise<AffinityEntry>
  updateScore(id: string, delta: number): Promise<AffinityEntry>
  saveFeedback(playerId: string, npcName: string, helpful: boolean): Promise<void>
  getFeedbackWeights(playerId: string): Promise<Record<string, number>>
}
