#!/usr/bin/env tsx
import { join } from 'path'
import { getPgPool, getNeo4jDriver, runMigrations } from '@valkaria/database'
import { OpenRouterProvider } from '@valkaria/ingestion-worker/src/infrastructure/ai/OpenRouterProvider.js'
import { runPipeline } from '@valkaria/ingestion-worker/src/pipeline.js'
import { modelConfig } from '@valkaria/config'
import 'dotenv/config'

const pool = getPgPool(process.env.DATABASE_URL!)
const driver = getNeo4jDriver(
  process.env.NEO4J_URI!,
  process.env.NEO4J_USER!,
  process.env.NEO4J_PASSWORD!
)

const models: Record<string, string> = {
  chat: modelConfig.chat.model,
  classification: modelConfig.classification.model,
  embedding: modelConfig.embedding.model,
  cypher: modelConfig.cypher.model,
  plan: modelConfig.plan.model,
  summarization: modelConfig.fallback.model,
}

const aiProvider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!, models)

await runMigrations(pool)

await runPipeline({
  locationsFile: join(__dirname, '../data/locations.csv'),
  npcsFile: join(__dirname, '../data/npcs.csv'),
  pool,
  driver,
  aiProvider,
})

await pool.end()
await driver.close()
process.exit(0)
