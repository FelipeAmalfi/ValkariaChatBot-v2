import type Redis from 'ioredis'
import type { AuthChallengeStore as IAuthChallengeStore, AuthChallenge } from '@valkaria/domain'

const KEY_PREFIX = 'auth_challenge:'
const TTL_SECONDS = 300

export class AuthChallengeStore implements IAuthChallengeStore {
  constructor(private redis: Redis) {}

  async save(challengeId: string, challenge: AuthChallenge): Promise<void> {
    await this.redis.set(`${KEY_PREFIX}${challengeId}`, JSON.stringify(challenge), 'EX', TTL_SECONDS)
  }

  async load(challengeId: string): Promise<AuthChallenge | null> {
    const raw = await this.redis.get(`${KEY_PREFIX}${challengeId}`)
    return raw ? (JSON.parse(raw) as AuthChallenge) : null
  }

  async delete(challengeId: string): Promise<void> {
    await this.redis.del(`${KEY_PREFIX}${challengeId}`)
  }
}
