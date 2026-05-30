import OpenAI from 'openai'
import type { AIProvider, AITask, ChatMessage } from '@valkaria/domain'
import { AIProviderError } from '@valkaria/domain'
import { ModelSelector } from '@valkaria/config'

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI
  private selector: ModelSelector

  constructor(private apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://valkaria.app',
        'X-Title': 'Valkária RPG',
      },
    })
    this.selector = new ModelSelector()
  }

  async complete(
    messages: ChatMessage[],
    _task: AITask = 'chat',
    temperature = 0.7,
    maxTokens = 1024
  ): Promise<{ content: string }> {
    const model = this.selector.pick()
    const start = Date.now()
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      })
      this.selector.record(model, Date.now() - start)
      return { content: response.choices[0]?.message?.content ?? '' }
    } catch (error) {
      this.selector.recordError(model)
      throw new AIProviderError(`OpenRouter error: ${(error as Error).message}`)
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })
      return response.data[0].embedding
    } catch (error) {
      throw new AIProviderError(`Embedding error: ${(error as Error).message}`)
    }
  }
}
