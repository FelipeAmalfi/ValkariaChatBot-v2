import type { AIProvider } from '@valkaria/domain'
import { cosineSimilarity } from '../ai/cosineSimilarity.js'

export class EmbeddingSemanticAuth {
  constructor(
    private aiProvider: AIProvider,
    private threshold: number = 0.6
  ) {}

  async generateChallenge(fieldText: string): Promise<{ embedding: number[]; question: string }> {
    const embedding = await this.aiProvider.embed(fieldText)
    const { content: question } = await this.aiProvider.complete(
      [
        {
          role: 'system',
          content:
            'Generate a single narrative RPG question that a character would ask to verify someone knows their background. Be creative and in-world. Output only the question, no preamble.',
        },
        { role: 'user', content: `Field content: "${fieldText}"` },
      ],
      'classification',
      0.8,
      150
    )
    return { embedding, question }
  }

  async validate(answer: string, storedEmbedding: number[]): Promise<boolean> {
    const answerEmbedding = await this.aiProvider.embed(answer)
    return cosineSimilarity(answerEmbedding, storedEmbedding) >= this.threshold
  }
}
