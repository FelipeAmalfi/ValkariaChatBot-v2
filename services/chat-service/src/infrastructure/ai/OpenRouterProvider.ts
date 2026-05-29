import OpenAI from 'openai'
import { AIProviderError } from '@valkaria/domain'
import type { AIProvider, AITask, ChatMessage } from '@valkaria/domain'

type ModelConfig = Record<AITask, string>

export class OpenRouterProvider implements AIProvider {
  private client: OpenAI

  constructor(
    private apiKey: string,
    private modelConfig: ModelConfig,
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
    maxTokens = 1024,
  ): Promise<{ content: string }> {
    try {
      const model = this.modelConfig[task] ?? this.modelConfig.chat
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
      const response = await this.client.embeddings.create({
        model: this.modelConfig.embedding,
        input: text,
      })
      return response.data[0].embedding
    } catch (error) {
      throw new AIProviderError(`Embedding error: ${(error as Error).message}`)
    }
  }
}
