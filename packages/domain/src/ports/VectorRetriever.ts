import type { RetrievedDocument } from '../entities/RetrievedDocument.js'

export interface VectorRetriever {
  search(
    embedding: number[],
    filters: Record<string, unknown> | undefined,
    topK: number
  ): Promise<RetrievedDocument[]>
}
