import type { Pool } from 'pg'
import type { NpcRow } from '../parsers/CsvParser.js'
import { normalizeLocationName } from '../parsers/CsvParser.js'

export class NpcIngester {
  constructor(private pool: Pool) {}

  async ingest(rows: NpcRow[], locationMap: Record<string, string>): Promise<void> {
    for (const row of rows) {
      const locationId =
        locationMap[row.location] ??
        locationMap[normalizeLocationName(row.location)] ??
        null

      const likes = row.likes
        ? row.likes.split('|').map((s) => s.trim()).filter(Boolean)
        : []
      const dislikes = row.dislikes
        ? row.dislikes.split('|').map((s) => s.trim()).filter(Boolean)
        : []

      const metadata = {
        likes,
        dislikes,
        benefits_cordial: row.benefits_cordial,
        benefits_loyal: row.benefits_loyal,
        benefits_intimate: row.benefits_intimate,
        last_demand: row.last_demand,
      }

      await this.pool.query(
        `INSERT INTO characters (name, description, location_id, metadata)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE
           SET description = EXCLUDED.description,
               location_id = EXCLUDED.location_id,
               metadata    = EXCLUDED.metadata,
               updated_at  = NOW()`,
        [row.name, row.description, locationId, JSON.stringify(metadata)]
      )
    }
  }
}
