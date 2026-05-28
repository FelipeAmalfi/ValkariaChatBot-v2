export interface MemoryEngine {
  append(threadId: string, message: string): Promise<void>
  getSummary(threadId: string): Promise<string | null>
}
