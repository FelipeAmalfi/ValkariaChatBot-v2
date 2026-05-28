import type { PlayerRepository, Player } from '@valkaria/domain'
import { ConflictError } from '@valkaria/domain'

interface RegisterInput {
  name: string
  class: string
  race: string
  background: string
  personality: string
  interests: string
}

export class RegisterPlayerUseCase {
  constructor(private playerRepo: PlayerRepository) {}

  async execute(input: RegisterInput): Promise<Player> {
    const existing = await this.playerRepo.findByName(input.name)
    if (existing) throw new ConflictError(`Player name "${input.name}" is already taken`)
    return this.playerRepo.create(input)
  }
}
