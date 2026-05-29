import type { Pool } from 'pg'
import type { LocationRepository } from '@valkaria/domain'
import type { Location } from '@valkaria/domain'

function toLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    services: (row.services ?? []) as string[],
    createdAt: (row.created_at as Date).toISOString(),
  }
}

export class PgLocationRepository implements LocationRepository {
  constructor(private pool: Pool) {}

  async findByName(name: string): Promise<Location | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM locations WHERE LOWER(name) = LOWER($1)',
      [name]
    )
    return rows[0] ? toLocation(rows[0]) : null
  }

  async findById(id: string): Promise<Location | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM locations WHERE id = $1',
      [id]
    )
    return rows[0] ? toLocation(rows[0]) : null
  }

  async findMany(filters?: { page?: number; pageSize?: number }): Promise<Location[]> {
    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const offset = (page - 1) * pageSize
    const { rows } = await this.pool.query(
      'SELECT * FROM locations ORDER BY name LIMIT $1 OFFSET $2',
      [pageSize, offset]
    )
    return rows.map(toLocation)
  }

  async upsert(location: Omit<Location, 'id' | 'createdAt'>): Promise<Location> {
    const { rows } = await this.pool.query(
      `INSERT INTO locations (name, description, services)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description,
         services = EXCLUDED.services
       RETURNING *`,
      [location.name, location.description, location.services]
    )
    return toLocation(rows[0])
  }
}
