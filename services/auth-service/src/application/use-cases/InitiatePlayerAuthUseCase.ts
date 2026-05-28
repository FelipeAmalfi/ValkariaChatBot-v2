import { randomUUID } from 'crypto'
import type { PlayerRepository, AuthChallengeStore } from '@valkaria/domain'
import { NotFoundError } from '@valkaria/domain'
import type { EmbeddingSemanticAuth } from '../../infrastructure/auth/EmbeddingSemanticAuth.js'

const PROFILE_FIELDS = ['background', 'personality', 'interests'] as const

interface InitiateAuthResult {
  challengeId: string
  question: string
}

export class InitiatePlayerAuthUseCase {
  constructor(
    private playerRepo: PlayerRepository,
    private semanticAuth: EmbeddingSemanticAuth,
    private challengeStore: AuthChallengeStore
  ) {}

  async execute(playerName: string): Promise<InitiateAuthResult> {
    const player = await this.playerRepo.findByName(playerName)
    if (!player) throw new NotFoundError(`Player "${playerName}" not found`)

    const field = PROFILE_FIELDS[Math.floor(Math.random() * PROFILE_FIELDS.length)]
    const fieldText = player[field]

    const { embedding, question } = await this.semanticAuth.generateChallenge(fieldText)

    const challengeId = randomUUID()
    await this.challengeStore.save(challengeId, {
      challengeId,
      playerId: player.id,
      fieldText,
      embedding,
      question,
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    })

    return { challengeId, question }
  }
}
