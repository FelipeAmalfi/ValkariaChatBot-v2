import type Redis from 'ioredis'
import type { SessionStore, SessionContext } from '@valkaria/domain'

export class RedisSessionContextStore implements SessionStore {
  constructor(private redis: Redis) {}

  async load(threadId: string): Promise<SessionContext | null> {
    const raw = await this.redis.get(`session:${threadId}`)
    return raw ? (JSON.parse(raw) as SessionContext) : null
  }

  async save(threadId: string, context: SessionContext): Promise<void> {
    await this.redis.set(`session:${threadId}`, JSON.stringify(context), 'EX', 86400)
  }

  async delete(threadId: string): Promise<void> {
    await this.redis.del(`session:${threadId}`)
  }
}
