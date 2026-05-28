import type { RetrievedDocument } from '../entities/RetrievedDocument.js'

export interface LoreQueryService {
  search(query: string, topK: number): Promise<RetrievedDocument[]>
}
