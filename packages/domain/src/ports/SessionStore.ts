import type { SessionContext } from '../entities/SessionContext.js'

export interface SessionStore {
  load(threadId: string): Promise<SessionContext | null>
  save(threadId: string, context: SessionContext): Promise<void>
  delete(threadId: string): Promise<void>
}
