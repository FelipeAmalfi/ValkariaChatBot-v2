import type { Pool } from 'pg'
import type { LocationRow } from '../parsers/CsvParser.js'
import { normalizeLocationName } from '../parsers/CsvParser.js'

export class LocationIngester {
  constructor(private pool: Pool) {}

  async ingest(rows: LocationRow[]): Promise<Record<string, string>> {
    const locationMap: Record<string, string> = {}

    for (const row of rows) {
      const services = row.services
        ? row.services.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const metadata = {
        short_description: row.short_description ?? '',
        honors: row.honors ?? '',
        npcs: row.npcs ? row.npcs.split('|').map(s => s.trim()).filter(Boolean) : [],
      }

      const { rows: result } = await this.pool.query<{ id: string }>(
        `INSERT INTO locations (name, description, services, metadata)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE
           SET description = EXCLUDED.description,
               services    = EXCLUDED.services,
               metadata    = EXCLUDED.metadata
         RETURNING id`,
        [row.name, row.full_description ?? row.short_description, services, JSON.stringify(metadata)]
      )

      const id = result[0].id
      locationMap[row.name] = id
      locationMap[normalizeLocationName(row.name)] = id
    }

    return locationMap
  }
}
