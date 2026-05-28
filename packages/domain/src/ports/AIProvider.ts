export type AITask = 'chat' | 'classification' | 'cypher' | 'plan' | 'summarization' | 'embedding'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  complete(
    messages: ChatMessage[],
    task?: AITask,
    temperature?: number,
    maxTokens?: number
  ): Promise<{ content: string }>

  embed(text: string): Promise<number[]>
}
