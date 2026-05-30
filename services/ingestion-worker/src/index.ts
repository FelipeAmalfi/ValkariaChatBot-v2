import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPgPool, getNeo4jDriver } from '@valkaria/database'
import { ModelSelector } from '@valkaria/config'
import OpenAI from 'openai'
import type { AIProvider, AITask, ChatMessage } from '@valkaria/domain'
import { AIProviderError } from '@valkaria/domain'
import { runPipeline } from './pipeline.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../../../infrastructure/data')

class IngestionAIProvider implements AIProvider {
  private client: OpenAI
  private selector = new ModelSelector()

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: { 'HTTP-Referer': 'https://valkaria.app', 'X-Title': 'Valkária RPG' },
    })
  }

  async complete(messages: ChatMessage[], _task: AITask = 'chat', temperature = 0.7, maxTokens = 1024): Promise<{ content: string }> {
    const model = this.selector.pick()
    const start = Date.now()
    try {
      const res = await this.client.chat.completions.create({ model, messages, temperature, max_tokens: maxTokens })
      this.selector.record(model, Date.now() - start)
      return { content: res.choices[0]?.message?.content ?? '' }
    } catch (error) {
      this.selector.recordError(model)
      throw new AIProviderError(`OpenRouter error: ${(error as Error).message}`)
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const res = await this.client.embeddings.create({ model: 'text-embedding-3-small', input: text })
      return res.data[0].embedding
    } catch (error) {
      throw new AIProviderError(`Embedding error: ${(error as Error).message}`)
    }
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/valkaria'
  const neo4jUri = process.env.NEO4J_URI ?? 'bolt://localhost:7687'
  const neo4jUser = process.env.NEO4J_USER ?? 'neo4j'
  const neo4jPassword = process.env.NEO4J_PASSWORD ?? 'valkaria-neo4j-pass'
  const apiKey = process.env.OPENROUTER_API_KEY ?? ''

  const pool = getPgPool(databaseUrl)
  const driver = getNeo4jDriver(neo4jUri, neo4jUser, neo4jPassword)
  const aiProvider = new IngestionAIProvider(apiKey)

  try {
    await runPipeline({
      locationsFile: path.join(DATA_DIR, 'locations.csv'),
      npcsFile: path.join(DATA_DIR, 'npcs.csv'),
      pool,
      driver,
      aiProvider,
    })
  } finally {
    await pool.end()
  }

  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
