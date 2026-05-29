import type { AffinityRepository, PlayerRepository, AffinityEntry } from '@valkaria/domain'
import { NotFoundError, scoreToLevel } from '@valkaria/domain'

interface Input {
  playerName: string
  npcName: string
  score: number
}

export class UpdateAffinityUseCase {
  constructor(
    private affinityRepo: AffinityRepository,
    private playerRepo: PlayerRepository,
  ) {}

  async execute({ playerName, npcName, score }: Input): Promise<AffinityEntry> {
    const player = await this.playerRepo.findByName(playerName)
    if (!player) throw new NotFoundError(`Player '${playerName}' not found`)

    const existing = await this.affinityRepo.findByPlayerAndNpc(player.id, npcName)

    return this.affinityRepo.upsert({
      playerId: player.id,
      npcName,
      score,
      level: scoreToLevel(score),
      interactionCount: existing?.interactionCount ?? 0,
      lastInteraction: new Date().toISOString(),
    })
  }
}
