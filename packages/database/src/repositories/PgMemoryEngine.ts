import type { Pool } from 'pg'
import type { MemoryEngine } from '@valkaria/domain'

export class PgMemoryEngine implements MemoryEngine {
  constructor(private pool: Pool) {}

  async getSummary(threadId: string): Promise<string | null> {
    const { rows } = await this.pool.query(
      'SELECT summary FROM memory_summaries WHERE thread_id = $1',
      [threadId]
    )
    return rows[0]?.summary ?? null
  }

  async append(threadId: string, message: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO memory_summaries (thread_id, summary, turn_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (thread_id) DO UPDATE SET
         summary = COALESCE(memory_summaries.summary, '') || $2,
         turn_count = memory_summaries.turn_count + 1,
         updated_at = NOW()`,
      [threadId, `\n${message}`]
    )
  }
}
