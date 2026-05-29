import 'dotenv/config'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import {
  getPgPool,
  getRedisClient,
  getNeo4jDriver,
  PgCharacterRepository,
  PgPlayerRepository,
  PgAffinityRepository,
  PgLocationRepository,
  PgVectorRetriever,
  PgMemoryEngine,
  RedisSessionContextStore,
} from '@valkaria/database'
import { modelConfig } from '@valkaria/config'
import type { LoreQueryService } from '@valkaria/domain'
import type { AITask } from '@valkaria/domain'
import { OpenRouterProvider } from '../infrastructure/ai/OpenRouterProvider.js'
import { buildValkáriaGraph } from '../interface/graph/builder.js'
import type { GraphDependencies } from '../interface/graph/dependencies.js'

function buildModelMap(): Record<AITask, string> {
  return {
    chat:           modelConfig.chat.model,
    classification: modelConfig.classification.model,
    cypher:         modelConfig.cypher.model,
    plan:           modelConfig.plan.model,
    summarization:  modelConfig.fallback.model,
    embedding:      modelConfig.embedding.model,
  }
}

export async function createContainer() {
  const databaseUrl   = process.env.DATABASE_URL   ?? 'postgresql://postgres:postgres@localhost:5432/valkaria'
  const redisUrl      = process.env.REDIS_URL      ?? 'redis://localhost:6379'
  const neo4jUri      = process.env.NEO4J_URI      ?? 'bolt://localhost:7687'
  const neo4jUser     = process.env.NEO4J_USER     ?? 'neo4j'
  const neo4jPassword = process.env.NEO4J_PASSWORD ?? 'password'
  const openRouterKey = process.env.OPENROUTER_API_KEY ?? ''

  const pgPool     = getPgPool(databaseUrl)
  const redis      = getRedisClient(redisUrl)
  const neo4jDriver = getNeo4jDriver(neo4jUri, neo4jUser, neo4jPassword)

  const checkpointer = new PostgresSaver(pgPool)
  await checkpointer.setup()

  const aiProvider = new OpenRouterProvider(openRouterKey, buildModelMap())

  const vectorRetriever = new PgVectorRetriever(pgPool)

  const loreQueryService: LoreQueryService = {
    async search(query: string, topK: number) {
      const embedding = await aiProvider.embed(query)
      return vectorRetriever.search(embedding, undefined, topK)
    },
  }

  const deps: GraphDependencies = {
    characterRepository: new PgCharacterRepository(pgPool),
    playerRepository:    new PgPlayerRepository(pgPool),
    affinityRepository:  new PgAffinityRepository(pgPool),
    locationRepository:  new PgLocationRepository(pgPool),
    vectorRetriever,
    loreQueryService,
    sessionStore:        new RedisSessionContextStore(redis),
    memoryEngine:        new PgMemoryEngine(pgPool),
    neo4jDriver,
    aiProvider,
  }

  const graph = buildValkáriaGraph(deps, checkpointer)

  return { graph, deps, pgPool, redis }
}
