import { getPgPool, getRedisClient, PgPlayerRepository } from '@valkaria/database'
import { OpenRouterProvider } from '../infrastructure/ai/OpenRouterProvider.js'
import { EmbeddingSemanticAuth } from '../infrastructure/auth/EmbeddingSemanticAuth.js'
import { AuthChallengeStore } from '../infrastructure/auth/AuthChallengeStore.js'
import { JwtService } from '../infrastructure/auth/JwtService.js'
import { RegisterPlayerUseCase } from '../application/use-cases/RegisterPlayerUseCase.js'
import { InitiatePlayerAuthUseCase } from '../application/use-cases/InitiatePlayerAuthUseCase.js'
import { ValidatePlayerAuthUseCase } from '../application/use-cases/ValidatePlayerAuthUseCase.js'
import { AuthenticateDMUseCase } from '../application/use-cases/AuthenticateDMUseCase.js'
import type { AuthControllerDeps } from '../interface/http/controllers/AuthController.js'

interface Env {
  DATABASE_URL: string
  REDIS_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  DM_PASSWORD: string
  OPENROUTER_API_KEY: string
  SEMANTIC_AUTH_THRESHOLD: string
  AI_CLASSIFICATION_MODEL?: string
  AI_EMBEDDING_MODEL?: string
}

function parseExpiryToSeconds(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/)
  if (!match) return 86400
  const n = parseInt(match[1], 10)
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return n * (units[match[2]] ?? 1)
}

export function buildContainer(env: Env): AuthControllerDeps {
  const pool = getPgPool(env.DATABASE_URL)
  const redis = getRedisClient(env.REDIS_URL)

  const playerRepo = new PgPlayerRepository(pool)
  const challengeStore = new AuthChallengeStore(redis)

  const aiProvider = new OpenRouterProvider(env.OPENROUTER_API_KEY, {
    chat: 'mistralai/mistral-7b-instruct:free',
    classification: env.AI_CLASSIFICATION_MODEL ?? 'mistralai/mistral-7b-instruct:free',
    embedding: env.AI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
    cypher: 'mistralai/mistral-7b-instruct:free',
    plan: 'mistralai/mistral-7b-instruct:free',
    summarization: 'mistralai/mistral-7b-instruct:free',
  })

  const threshold = parseFloat(env.SEMANTIC_AUTH_THRESHOLD)
  const semanticAuth = new EmbeddingSemanticAuth(aiProvider, threshold)
  const jwtService = new JwtService(env.JWT_SECRET, parseExpiryToSeconds(env.JWT_EXPIRES_IN))

  return {
    registerPlayer: new RegisterPlayerUseCase(playerRepo),
    initiatePlayerAuth: new InitiatePlayerAuthUseCase(playerRepo, semanticAuth, challengeStore),
    validatePlayerAuth: new ValidatePlayerAuthUseCase(playerRepo, semanticAuth, challengeStore, jwtService),
    authenticateDM: new AuthenticateDMUseCase(jwtService, env.DM_PASSWORD),
  }
}
