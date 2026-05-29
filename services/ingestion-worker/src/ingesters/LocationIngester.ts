import type { Pool } from 'pg'
import type { LocationRow } from '../parsers/CsvParser.js'

export class LocationIngester {
  constructor(private pool: Pool) {}

  async ingest(rows: LocationRow[]): Promise<Record<string, string>> {
    const locationMap: Record<string, string> = {}

    for (const row of rows) {
      const services = row.services
        ? row.services.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const { rows: result } = await this.pool.query<{ id: string }>(
        `INSERT INTO locations (name, description, services)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE
           SET description = EXCLUDED.description,
               services    = EXCLUDED.services
         RETURNING id`,
        [row.name, row.description, services]
      )

      locationMap[row.name] = result[0].id
    }

    return locationMap
  }
}
