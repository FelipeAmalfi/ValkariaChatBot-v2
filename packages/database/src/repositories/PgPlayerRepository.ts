import type { Pool } from 'pg'
import type { PlayerRepository } from '@valkaria/domain'
import type { Player } from '@valkaria/domain'

function toPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    class: row.class as string,
    race: row.race as string,
    background: row.background as string,
    personality: row.personality as string,
    interests: row.interests as string,
    avatarUrl: row.avatar_url as string | undefined,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }
}

export class PgPlayerRepository implements PlayerRepository {
  constructor(private pool: Pool) {}

  async findByName(name: string): Promise<Player | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM players WHERE LOWER(name) = LOWER($1)',
      [name]
    )
    return rows[0] ? toPlayer(rows[0]) : null
  }

  async findById(id: string): Promise<Player | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    )
    return rows[0] ? toPlayer(rows[0]) : null
  }

  async create(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> {
    const { rows } = await this.pool.query(
      `INSERT INTO players (name, class, race, background, personality, interests)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [player.name, player.class, player.race, player.background, player.personality, player.interests]
    )
    return toPlayer(rows[0])
  }

  async findMany(filters?: { page?: number; pageSize?: number }): Promise<Player[]> {
    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const offset = (page - 1) * pageSize
    const { rows } = await this.pool.query(
      'SELECT * FROM players ORDER BY name LIMIT $1 OFFSET $2',
      [pageSize, offset]
    )
    return rows.map(toPlayer)
  }

  async update(id: string, partial: Partial<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Player> {
    const columnMap: Record<string, string> = { avatarUrl: 'avatar_url' }
    const fields = Object.keys(partial) as Array<keyof typeof partial>
    const sets = fields.map((f, i) => `${columnMap[String(f)] ?? String(f)} = $${i + 2}`).join(', ')
    const values = fields.map(f => partial[f])
    const { rows } = await this.pool.query(
      `UPDATE players SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    )
    return toPlayer(rows[0])
  }
}
