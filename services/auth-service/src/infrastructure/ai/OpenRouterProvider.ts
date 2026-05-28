import OpenAI from 'openai'
import type { AIProvider, AITask, ChatMessage } from '@valkaria/domain'
import { AIProviderError } from '@valkaria/domain'

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI

  constructor(
    private apiKey: string,
    private models: Record<string, string>
  ) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://valkaria.app',
        'X-Title': 'Valkária RPG',
      },
    })
  }

  async complete(
    messages: ChatMessage[],
    task: AITask = 'chat',
    temperature = 0.7,
    maxTokens = 1024
  ): Promise<{ content: string }> {
    try {
      const model = this.models[task] ?? this.models['chat'] ?? 'mistralai/mistral-7b-instruct:free'
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })
      return { content: response.choices[0]?.message?.content ?? '' }
    } catch (error) {
      throw new AIProviderError(`OpenRouter error: ${(error as Error).message}`)
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const model = this.models['embedding'] ?? 'text-embedding-3-small'
      const response = await this.client.embeddings.create({ model, input: text })
      return response.data[0].embedding
    } catch (error) {
      throw new AIProviderError(`Embedding error: ${(error as Error).message}`)
    }
  }
}
