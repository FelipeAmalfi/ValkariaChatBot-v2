import type { AffinityRepository, PlayerRepository, AffinityEntry } from '@valkaria/domain'
import { NotFoundError } from '@valkaria/domain'

import { scoreToLevel } from '@valkaria/domain'

interface SetAffinityInput {
  playerName: string
  npcName: string
  score: number
}

export class SetAffinityUseCase {
  constructor(
    private affinityRepo: AffinityRepository,
    private playerRepo: PlayerRepository,
  ) {}

  async execute({ playerName, npcName, score }: SetAffinityInput): Promise<AffinityEntry> {
    const player = await this.playerRepo.findByName(playerName)
    if (!player) throw new NotFoundError(`Player '${playerName}' not found`)

    const clamped = Math.max(1, Math.min(7, Math.round(score)))
    const level = scoreToLevel(clamped)

    return this.affinityRepo.upsert({
      playerId: player.id,
      npcName,
      level,
      score: clamped,
      interactionCount: 0,
      lastInteraction: new Date().toISOString(),
    })
  }
}
