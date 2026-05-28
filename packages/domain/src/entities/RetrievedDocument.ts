export interface RetrievedDocument {
  id: string
  document: string
  score: number
  metadata: Record<string, unknown>
}
