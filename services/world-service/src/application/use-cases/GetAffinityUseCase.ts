import type { AffinityRepository, PlayerRepository, AffinityEntry } from '@valkaria/domain'
import { NotFoundError } from '@valkaria/domain'

interface Input {
  playerName: string
  npcName: string
}

export class GetAffinityUseCase {
  constructor(
    private affinityRepo: AffinityRepository,
    private playerRepo: PlayerRepository,
  ) {}

  async execute({ playerName, npcName }: Input): Promise<AffinityEntry | null> {
    const player = await this.playerRepo.findByName(playerName)
    if (!player) throw new NotFoundError(`Player '${playerName}' not found`)
    return this.affinityRepo.findByPlayerAndNpc(player.id, npcName)
  }
}
