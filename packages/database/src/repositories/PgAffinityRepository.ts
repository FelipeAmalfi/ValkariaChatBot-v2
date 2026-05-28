import type { Pool } from 'pg'
import type { AffinityRepository } from '@valkaria/domain'
import type { AffinityEntry } from '@valkaria/domain'
import { scoreToLevel } from '@valkaria/domain'

function toAffinityEntry(row: Record<string, unknown>): AffinityEntry {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    npcName: row.npc_name as string,
    level: row.level as AffinityEntry['level'],
    score: row.score as number,
    interactionCount: row.interaction_count as number,
    lastInteraction: row.last_interaction ? (row.last_interaction as Date).toISOString() : null,
  }
}

export class PgAffinityRepository implements AffinityRepository {
  constructor(private pool: Pool) {}

  async findByPlayerAndNpc(playerId: string, npcName: string): Promise<AffinityEntry | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM npc_affinity WHERE player_id = $1 AND LOWER(npc_name) = LOWER($2)',
      [playerId, npcName]
    )
    return rows[0] ? toAffinityEntry(rows[0]) : null
  }

  async findByPlayer(playerId: string): Promise<AffinityEntry[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM npc_affinity WHERE player_id = $1 ORDER BY score DESC',
      [playerId]
    )
    return rows.map(toAffinityEntry)
  }

  async upsert(entry: Omit<AffinityEntry, 'id'>): Promise<AffinityEntry> {
    const { rows } = await this.pool.query(
      `INSERT INTO npc_affinity (player_id, npc_name, level, score, interaction_count, last_interaction)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (player_id, npc_name) DO UPDATE SET
         level = EXCLUDED.level,
         score = EXCLUDED.score,
         interaction_count = EXCLUDED.interaction_count,
         last_interaction = EXCLUDED.last_interaction
       RETURNING *`,
      [
        entry.playerId,
        entry.npcName,
        entry.level,
        entry.score,
        entry.interactionCount,
        entry.lastInteraction,
      ]
    )
    return toAffinityEntry(rows[0])
  }

  async updateScore(id: string, delta: number): Promise<AffinityEntry> {
    const { rows } = await this.pool.query(
      `UPDATE npc_affinity
       SET score = GREATEST(0, LEAST(100, score + $2)),
           interaction_count = interaction_count + 1,
           last_interaction = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, delta]
    )
    const entry = toAffinityEntry(rows[0])
    const newLevel = scoreToLevel(entry.score)
    if (newLevel !== entry.level) {
      await this.pool.query('UPDATE npc_affinity SET level = $1 WHERE id = $2', [newLevel, id])
      entry.level = newLevel
    }
    return entry
  }

  async saveFeedback(playerId: string, npcName: string, helpful: boolean): Promise<void> {
    await this.pool.query(
      'INSERT INTO recommendation_feedback (player_id, npc_name, helpful) VALUES ($1, $2, $3)',
      [playerId, npcName, helpful]
    )
  }

  async getFeedbackWeights(playerId: string): Promise<Record<string, number>> {
    const { rows } = await this.pool.query(
      `SELECT npc_name,
              SUM(CASE WHEN helpful THEN 1 ELSE -1 END)::float / COUNT(*) AS weight
       FROM recommendation_feedback
       WHERE player_id = $1
       GROUP BY npc_name`,
      [playerId]
    )
    return Object.fromEntries(rows.map((r: Record<string, unknown>) => [r.npc_name, r.weight]))
  }
}
