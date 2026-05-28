import type { AuthChallenge } from '../entities/AuthChallenge.js'

export interface AuthChallengeStore {
  save(challengeId: string, challenge: AuthChallenge): Promise<void>
  load(challengeId: string): Promise<AuthChallenge | null>
  delete(challengeId: string): Promise<void>
}
