import type { Driver } from 'neo4j-driver'
import type { NpcRow } from '../parsers/CsvParser.js'

const BATCH_SIZE = 100

export class Neo4jIngester {
  private session: ReturnType<Driver['session']>

  constructor(private driver: Driver) {
    this.session = driver.session()
  }

  async ingest(rows: NpcRow[], locationMap: Record<string, string>): Promise<void> {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const tx = this.session.beginTransaction()

      try {
        for (const row of batch) {
          const likes = row.likes
            ? row.likes.split(',').map((s) => s.trim()).filter(Boolean)
            : []

          await tx.run(
            `MERGE (n:NPC {name: $name})
             SET n.description = $description`,
            { name: row.name, description: row.description }
          )

          if (row.location) {
            await tx.run(
              `MERGE (l:Location {name: $location})
               WITH l
               MATCH (n:NPC {name: $name})
               MERGE (n)-[:LOCATED_IN]->(l)`,
              { location: row.location, name: row.name }
            )
          }

          for (const like of likes) {
            await tx.run(
              `MERGE (i:Interest {name: $interest})
               WITH i
               MATCH (n:NPC {name: $name})
               MERGE (n)-[:LIKES]->(i)`,
              { interest: like, name: row.name }
            )
          }
        }

        await tx.commit()
      } catch (err) {
        await tx.rollback()
        throw err
      }
    }
  }

  async close(): Promise<void> {
    await this.session.close()
  }
}
