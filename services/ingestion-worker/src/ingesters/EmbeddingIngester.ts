import type { Pool } from 'pg'
import type { AIProvider } from '@valkaria/domain'

interface CharacterRow {
  id: string
  name: string
  description: string
  location_name: string | null
  metadata: {
    likes?: string[]
    dislikes?: string[]
  }
}

const BATCH_SIZE = 5
const DELAY_MS = 200

function buildEmbeddingText(char: CharacterRow): string {
  const likes = char.metadata.likes?.join(', ') ?? ''
  const location = char.location_name ?? 'unknown'
  return `${char.name}: ${char.description}. Located in ${location}. Likes: ${likes}.`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class EmbeddingIngester {
  constructor(
    private pool: Pool,
    private aiProvider: AIProvider
  ) {}

  async ingest(): Promise<void> {
    const { rows: characters } = await this.pool.query<CharacterRow>(`
      SELECT c.id, c.name, c.description, l.name AS location_name, c.metadata
      FROM characters c
      LEFT JOIN locations l ON l.id = c.location_id
      WHERE c.role = 'npc'
    `)

    const pending: CharacterRow[] = []
    for (const char of characters) {
      const { rows } = await this.pool.query(
        'SELECT 1 FROM langchain_pg_embedding WHERE custom_id = $1',
        [char.name]
      )
      if (rows.length === 0) pending.push(char)
    }

    console.log(`      Generating embeddings for ${pending.length} NPCs (${characters.length - pending.length} already exist)`)

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (char) => {
          const text = buildEmbeddingText(char)
          const vector = await this.aiProvider.embed(text)

          await this.pool.query(
            `INSERT INTO langchain_pg_embedding (embedding, document, cmetadata, custom_id)
             VALUES ($1, $2, $3, $4)`,
            [
              JSON.stringify(vector),
              text,
              JSON.stringify({ type: 'npc', name: char.name, location: char.location_name }),
              char.name,
            ]
          )
        })
      )

      if (i + BATCH_SIZE < pending.length) {
        await delay(DELAY_MS)
      }
    }
  }
}
