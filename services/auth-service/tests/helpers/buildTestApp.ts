import { vi } from 'vitest'
import type Redis from 'ioredis'
import { getPgPool, PgPlayerRepository } from '@valkaria/database'
import { createServer } from '../../src/interface/http/server.js'
import { AuthChallengeStore } from '../../src/infrastructure/auth/AuthChallengeStore.js'
import { EmbeddingSemanticAuth } from '../../src/infrastructure/auth/EmbeddingSemanticAuth.js'
import { JwtService } from '../../src/infrastructure/auth/JwtService.js'
import { RegisterPlayerUseCase } from '../../src/application/use-cases/RegisterPlayerUseCase.js'
import { InitiatePlayerAuthUseCase } from '../../src/application/use-cases/InitiatePlayerAuthUseCase.js'
import { ValidatePlayerAuthUseCase } from '../../src/application/use-cases/ValidatePlayerAuthUseCase.js'
import { AuthenticateDMUseCase } from '../../src/application/use-cases/AuthenticateDMUseCase.js'

const TEST_JWT_SECRET = 'test-jwt-secret-at-least-32-characters!!'
const TEST_DM_PASSWORD = 'test-dm-password'
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/valkaria'

function makeMockRedis(): Redis {
  const store = new Map<string, string>()
  return {
    set: vi.fn(async (key: string, value: string) => { store.set(key, value); return 'OK' }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (key: string) => { store.delete(key); return 1 }),
    ping: vi.fn(async () => 'PONG'),
  } as unknown as Redis
}

export async function buildTestApp() {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  process.env.DM_PASSWORD = TEST_DM_PASSWORD
  process.env.FRONTEND_URL = 'http://localhost:3000'

  const pool = getPgPool(DATABASE_URL)
  const redis = makeMockRedis()

  const playerRepo = new PgPlayerRepository(pool)
  const challengeStore = new AuthChallengeStore(redis)

  const mockAiProvider = {
    complete: vi.fn().mockResolvedValue({ content: 'test' }),
    embed: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  }

  const semanticAuth = new EmbeddingSemanticAuth(mockAiProvider as any, 0.7)
  const jwtService = new JwtService(TEST_JWT_SECRET, 86400)

  const deps = {
    registerPlayer: new RegisterPlayerUseCase(playerRepo),
    initiatePlayerAuth: new InitiatePlayerAuthUseCase(playerRepo, semanticAuth, challengeStore),
    validatePlayerAuth: new ValidatePlayerAuthUseCase(playerRepo, semanticAuth, challengeStore, jwtService),
    authenticateDM: new AuthenticateDMUseCase(jwtService, TEST_DM_PASSWORD),
  }

  const app = await createServer(deps, pool, redis)
  await app.ready()

  return Object.assign(app, { pool })
}

export async function truncateTestData(pool: ReturnType<typeof getPgPool>): Promise<void> {
  await pool.query('TRUNCATE players CASCADE')
}

let _counter = 0
export function createTestPlayer() {
  _counter++
  return {
    name: `TestPlayer${_counter}_${Date.now()}`,
    class: 'Guerreiro',
    race: 'Humano',
    background: 'Um guerreiro experiente que viajou por toda Valkária buscando batalhas e glória.',
    personality: 'Direto e honrado, nunca foge de um desafio.',
    interests: 'combate, honra, armas antigas',
  }
}
