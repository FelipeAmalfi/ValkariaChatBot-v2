import type { AffinityRepository, PlayerRepository, AffinityEntry } from '@valkaria/domain'
import { NotFoundError } from '@valkaria/domain'

export class ListAffinitiesUseCase {
  constructor(
    private affinityRepo: AffinityRepository,
    private playerRepo: PlayerRepository,
  ) {}

  async execute(playerName: string): Promise<AffinityEntry[]> {
    const player = await this.playerRepo.findByName(playerName)
    if (!player) throw new NotFoundError(`Player '${playerName}' not found`)
    return this.affinityRepo.findByPlayer(player.id)
  }
}
