import type { Pool } from 'pg'
import type { CharacterRepository } from '@valkaria/domain'
import type { Character } from '@valkaria/domain'

function toCharacter(row: Record<string, unknown>): Character {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    role: row.role as Character['role'],
    faction: row.faction as string,
    locationId: row.location_id as string | null,
    metadata: (row.metadata ?? {}) as Character['metadata'],
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }
}

export class PgCharacterRepository implements CharacterRepository {
  constructor(private pool: Pool) {}

  async findByName(name: string): Promise<Character | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM characters WHERE LOWER(name) = LOWER($1)',
      [name]
    )
    return rows[0] ? toCharacter(rows[0]) : null
  }

  async findMany(filters?: {
    location?: string
    faction?: string
    role?: string
    page?: number
    pageSize?: number
  }): Promise<Character[]> {
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    if (filters?.location) {
      conditions.push(`LOWER(location_id::text) = LOWER($${idx++})`)
      params.push(filters.location)
    }
    if (filters?.faction) {
      conditions.push(`LOWER(faction) = LOWER($${idx++})`)
      params.push(filters.faction)
    }
    if (filters?.role) {
      conditions.push(`role = $${idx++}`)
      params.push(filters.role)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const offset = (page - 1) * pageSize

    params.push(pageSize, offset)
    const { rows } = await this.pool.query(
      `SELECT * FROM characters ${where} ORDER BY name LIMIT $${idx++} OFFSET $${idx}`,
      params
    )
    return rows.map(toCharacter)
  }

  async upsert(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    const { rows } = await this.pool.query(
      `INSERT INTO characters (name, description, role, faction, location_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description,
         role = EXCLUDED.role,
         faction = EXCLUDED.faction,
         location_id = EXCLUDED.location_id,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()
       RETURNING *`,
      [
        character.name,
        character.description,
        character.role,
        character.faction,
        character.locationId,
        JSON.stringify(character.metadata),
      ]
    )
    return toCharacter(rows[0])
  }
}
