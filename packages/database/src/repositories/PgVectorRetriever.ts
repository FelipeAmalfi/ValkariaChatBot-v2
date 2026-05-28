import type { Pool } from 'pg'
import { toSql } from 'pgvector/pg'
import type { VectorRetriever, RetrievedDocument } from '@valkaria/domain'

export class PgVectorRetriever implements VectorRetriever {
  constructor(private pool: Pool) {}

  async search(
    embedding: number[],
    filters: Record<string, unknown> | undefined,
    topK: number
  ): Promise<RetrievedDocument[]> {
    const embeddingParam = toSql(embedding)
    const params: unknown[] = [embeddingParam, topK]
    let filterClause = ''

    if (filters?.type) {
      params.push(filters.type)
      filterClause = `AND cmetadata->>'type' = $${params.length}`
    }

    const { rows } = await this.pool.query(
      `SELECT uuid AS id, document, cmetadata AS metadata,
              1 - (embedding <=> $1) AS score
       FROM langchain_pg_embedding
       WHERE 1 - (embedding <=> $1) >= 0.3
       ${filterClause}
       ORDER BY embedding <=> $1
       LIMIT $2`,
      params
    )

    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      document: r.document as string,
      score: r.score as number,
      metadata: (r.metadata ?? {}) as Record<string, unknown>,
    }))
  }
}
