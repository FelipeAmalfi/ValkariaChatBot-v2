import type { PlayerRepository, AuthChallengeStore } from '@valkaria/domain'
import { NotFoundError, UnauthorizedError } from '@valkaria/domain'
import type { EmbeddingSemanticAuth } from '../../infrastructure/auth/EmbeddingSemanticAuth.js'
import type { JwtService } from '../../infrastructure/auth/JwtService.js'

interface ValidateAuthResult {
  token: string
}

export class ValidatePlayerAuthUseCase {
  constructor(
    private playerRepo: PlayerRepository,
    private semanticAuth: EmbeddingSemanticAuth,
    private challengeStore: AuthChallengeStore,
    private jwtService: JwtService
  ) {}

  async execute(challengeId: string, answer: string): Promise<ValidateAuthResult> {
    const challenge = await this.challengeStore.load(challengeId)
    if (!challenge) throw new NotFoundError('Challenge expired or not found')

    const valid = await this.semanticAuth.validate(answer, challenge.embedding)
    await this.challengeStore.delete(challengeId)

    if (!valid) throw new UnauthorizedError('Answer does not match. Access denied.')

    const player = await this.playerRepo.findById(challenge.playerId)
    if (!player) throw new NotFoundError('Player not found')

    const token = this.jwtService.sign({
      playerId: player.id,
      playerName: player.name,
      role: 'PLAYER',
    })

    return { token }
  }
}
