# Phase 04 — Auth Service

**Agent**: `database` (repositories) + `ai-provider` (embedding calls)  
**Depends on**: Phase 02, 03  
**Service**: `services/auth-service/` (port 3002)

---

## What you're building

The standalone authentication microservice. Stateless — scales horizontally. Handles player registration, narrative auth challenges, JWT issuance, and DM login. All JWTs it issues are verifiable by chat-service and world-service using the shared `JWT_SECRET`.

---

## Directory structure

```
services/auth-service/
├── src/
│   ├── infrastructure/
│   │   ├── ai/
│   │   │   ├── OpenRouterProvider.ts
│   │   │   └── cosineSimilarity.ts
│   │   └── auth/
│   │       ├── JwtService.ts
│   │       ├── EmbeddingSemanticAuth.ts
│   │       └── AuthChallengeStore.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── RegisterPlayerUseCase.ts
│   │       ├── InitiatePlayerAuthUseCase.ts
│   │       ├── ValidatePlayerAuthUseCase.ts
│   │       └── AuthenticateDMUseCase.ts
│   ├── interface/
│   │   └── http/
│   │       ├── server.ts
│   │       ├── controllers/
│   │       │   └── AuthController.ts
│   │       ├── schemas/
│   │       │   └── authSchemas.ts
│   │       └── errorHandler.ts
│   ├── composition/
│   │   └── container.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   └── EmbeddingSemanticAuth.test.ts
│   └── integration/
│       └── auth.test.ts
├── package.json
└── tsconfig.json
```

---

## Packages to install

```bash
npm install fastify @fastify/jwt @fastify/cors @fastify/helmet @fastify/rate-limit \
  openai zod \
  @valkaria/domain @valkaria/config @valkaria/database \
  -w @valkaria/auth-service

npm install -D vitest @types/node tsx -w @valkaria/auth-service
```

---

## Files to create

### `src/infrastructure/auth/JwtService.ts`
```typescript
import jwt from 'jsonwebtoken'

export type JwtRole = 'PLAYER' | 'DM'
export interface JwtPayload {
  playerId?: string
  playerName?: string
  role: JwtRole
}

export class JwtService {
  constructor(
    private secret: string,
    private expiresIn: string = '24h'
  ) {}

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn })
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload
  }
}
```

### `src/infrastructure/ai/cosineSimilarity.ts`
```typescript
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector length mismatch')
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0))
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}
```

### `src/infrastructure/auth/EmbeddingSemanticAuth.ts`
```typescript
import type { AIProvider } from '@valkaria/domain'
import { cosineSimilarity } from '../ai/cosineSimilarity'

export class EmbeddingSemanticAuth {
  constructor(
    private aiProvider: AIProvider,
    private threshold: number = 0.6
  ) {}

  async generateChallenge(fieldText: string): Promise<{ embedding: number[]; question: string }> {
    const embedding = await this.aiProvider.embed(fieldText)
    const { content: question } = await this.aiProvider.complete([
      { role: 'system', content: 'Generate a single narrative RPG question that a character would ask to verify someone knows their background. Be creative and in-world. Output only the question, no preamble.' },
      { role: 'user', content: `Field content: "${fieldText}"` }
    ], 'classification', 0.8, 150)
    return { embedding, question }
  }

  async validate(answer: string, storedEmbedding: number[]): Promise<boolean> {
    const answerEmbedding = await this.aiProvider.embed(answer)
    return cosineSimilarity(answerEmbedding, storedEmbedding) >= this.threshold
  }
}
```

### `src/application/use-cases/RegisterPlayerUseCase.ts`
Takes player registration data, checks for name conflict (`ConflictError` if exists), creates player in DB, returns the created player.

### `src/application/use-cases/InitiatePlayerAuthUseCase.ts`
Finds player by name, picks a random profile field (background | personality | interests), generates challenge via `EmbeddingSemanticAuth`, stores in `AuthChallengeStore` with 5-minute TTL, returns `{ challengeId, question }`.

### `src/application/use-cases/ValidatePlayerAuthUseCase.ts`
Loads challenge from store (`NotFoundError` if expired), validates answer via `EmbeddingSemanticAuth`, deletes challenge, issues JWT on success, throws `UnauthorizedError` on failure.

### `src/application/use-cases/AuthenticateDMUseCase.ts`
Compares provided password with `DM_PASSWORD` env var. Issues JWT with `role: 'DM'` on match, throws `UnauthorizedError` on mismatch.

### `src/interface/http/server.ts`
```typescript
import Fastify from 'fastify'
import { fastifyJwt } from '@fastify/jwt'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { errorHandler } from './errorHandler'
import { AuthController } from './controllers/AuthController'

export async function createServer(deps: { /* use cases */ }) {
  const app = Fastify({ logger: false })
  
  await app.register(helmet)
  await app.register(cors, { origin: process.env.FRONTEND_URL })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
  
  app.setErrorHandler(errorHandler)
  
  app.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    version: '0.1.0'
  }))
  
  const controller = new AuthController(deps)
  controller.register(app)
  
  return app
}
```

### `src/interface/http/errorHandler.ts`
Catches `AppError` instances, returns `{ error: message, statusCode }` with the correct HTTP status. Non-AppError errors return 500.

### `src/interface/http/controllers/AuthController.ts`
Registers routes: 
- `POST /auth/register` → RegisterPlayerUseCase
- `POST /auth/initiate` → InitiatePlayerAuthUseCase
- `POST /auth/validate` → ValidatePlayerAuthUseCase
- `POST /auth/dm` → AuthenticateDMUseCase

All routes use Zod schemas for request body validation.

### `src/composition/container.ts`
Creates all dependencies and wires them together. Called once at startup.

### `src/index.ts`
Entry point: validates env, creates container, creates server, starts listening on `AUTH_PORT`.

---

## Key implementation notes

1. auth-service has no database migrations of its own — it uses `packages/database` which handles migrations.
2. The `JwtService` must use `jsonwebtoken` — install it: `npm install jsonwebtoken && npm install -D @types/jsonwebtoken -w @valkaria/auth-service`.
3. `AuthChallengeStore` wraps `RedisSessionContextStore` pattern from phase 03 but with key prefix `auth_challenge:` and 300s TTL.
4. The `OpenRouterProvider` in this service is a minimal version — only needs `embed()` for the auth challenge. Reference `spec/agents/ai-provider.md` for implementation.
5. Player profile fields to randomly choose from: `['background', 'personality', 'interests']`. Pick with `Math.floor(Math.random() * 3)`.

---

## Environment variables needed

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/valkaria
REDIS_URL=redis://localhost:6379
AUTH_PORT=3002
JWT_SECRET=change-me-to-32-char-minimum-secret
JWT_EXPIRES_IN=24h
DM_PASSWORD=change-me-min-8-chars
OPENROUTER_API_KEY=sk-or-v1-your-key-here
SEMANTIC_AUTH_THRESHOLD=0.6
FRONTEND_URL=http://localhost:3000
```

---

## Acceptance check

```bash
npm run dev -w @valkaria/auth-service   # starts on port 3002
```

Run `verify-api` skill — tests 1, 2, 3 must pass:
- Test 1: `GET /health` → 200
- Test 2: `POST /auth/register` → 201
- Test 3: `POST /auth/initiate` → 200 with challengeId and question
