# Phase 02 — Shared Packages

**Agent**: `domain`  
**Depends on**: Phase 01  
**Service**: `packages/domain/`, `packages/shared/`, `packages/config/`

---

## What you're building

Three shared packages that all services depend on. These must be built before any service because services import from them. `domain` is the most critical — it defines all entity types, error classes, and port interfaces. `config` provides the Pino logger and Zod env validator. `shared` has minimal TypeScript primitives.

---

## Directory structure

```
packages/
├── domain/
│   └── src/
│       ├── entities/
│       │   ├── Character.ts
│       │   ├── Player.ts
│       │   ├── Location.ts
│       │   └── AffinityEntry.ts
│       ├── errors/
│       │   └── AppError.ts
│       ├── value-objects/
│       │   ├── AffinityLevel.ts
│       │   └── Role.ts
│       ├── ports/
│       │   ├── AIProvider.ts
│       │   ├── CharacterRepository.ts
│       │   ├── PlayerRepository.ts
│       │   ├── AffinityRepository.ts
│       │   ├── LocationRepository.ts
│       │   ├── SessionStore.ts
│       │   ├── MemoryEngine.ts
│       │   ├── VectorRetriever.ts
│       │   ├── LoreQueryService.ts
│       │   └── AuthChallengeStore.ts
│       └── index.ts
├── shared/
│   └── src/
│       └── index.ts
└── config/
    └── src/
        ├── env.ts
        ├── logger.ts
        ├── modelConfig.ts
        └── index.ts
```

---

## Packages to install

```bash
# packages/config only — domain and shared have zero runtime deps
npm install zod pino pino-pretty uuid -w @valkaria/config
npm install -D @types/uuid -w @valkaria/config
```

---

## Files to create

### `packages/shared/src/index.ts`
```typescript
export type ID = string
export type Timestamp = string  // ISO 8601

export interface Pagination {
  page: number
  pageSize: number
  total: number
}

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
```

### `packages/domain/src/errors/AppError.ts`
```typescript
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends AppError {
  constructor(m: string) { super(m, 400) }
}
export class NotFoundError extends AppError {
  constructor(m: string) { super(m, 404) }
}
export class UnauthorizedError extends AppError {
  constructor(m: string) { super(m, 401) }
}
export class ForbiddenError extends AppError {
  constructor(m: string) { super(m, 403) }
}
export class ConflictError extends AppError {
  constructor(m: string) { super(m, 409) }
}
export class InfrastructureError extends AppError {
  constructor(m: string) { super(m, 500) }
}
export class RepositoryError extends InfrastructureError {}
export class AIProviderError extends AppError {
  constructor(m: string) { super(m, 502) }
}
```

### `packages/domain/src/value-objects/AffinityLevel.ts`
```typescript
export type AffinityLevel = 'none' | 'cordial' | 'loyal' | 'intimate'

export function scoreToLevel(score: number): AffinityLevel {
  if (score <= 0)  return 'none'
  if (score <= 25) return 'cordial'
  if (score <= 75) return 'loyal'
  return 'intimate'
}
```

### `packages/domain/src/entities/Character.ts`
Define the `Character` interface, `CharacterRole`, `CharacterFaction`, `CharacterMetadata`. See `spec/agents/domain.md` for exact shape.

### `packages/domain/src/entities/Player.ts`
Define `Player` interface with: id, name, class, race, background, personality, interests, createdAt, updatedAt.

### `packages/domain/src/entities/AffinityEntry.ts`
Define `AffinityEntry` interface and `AffinitySnapshot` (lightweight version for session context).

### `packages/domain/src/entities/Location.ts`
```typescript
export interface Location {
  id: string
  name: string
  description: string | null
  services: string[]
  createdAt: string
}
```

### `packages/domain/src/ports/AIProvider.ts`
```typescript
export type AITask = 'chat' | 'classification' | 'cypher' | 'plan' | 'summarization' | 'embedding'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIProvider {
  complete(
    messages: ChatMessage[],
    task?: AITask,
    temperature?: number,
    maxTokens?: number
  ): Promise<{ content: string }>
  
  embed(text: string): Promise<number[]>
}
```

### `packages/domain/src/ports/CharacterRepository.ts`
```typescript
import type { Character } from '../entities/Character'

export interface CharacterRepository {
  findByName(name: string): Promise<Character | null>
  findMany(filters?: {
    location?: string
    faction?: string
    role?: string
    page?: number
    pageSize?: number
  }): Promise<Character[]>
  upsert(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character>
}
```

### Other port files
Create similar interfaces for: `PlayerRepository`, `AffinityRepository`, `LocationRepository`, `SessionStore`, `MemoryEngine`, `VectorRetriever`, `LoreQueryService`, `AuthChallengeStore`.

Key methods per port:
- **SessionStore**: `load(threadId)`, `save(threadId, context)`, `delete(threadId)`
- **MemoryEngine**: `append(threadId, message)`, `getSummary(threadId)`
- **VectorRetriever**: `search(embedding, filters, topK)` → `RetrievedDocument[]`
- **AuthChallengeStore**: `save(challengeId, challenge)`, `load(challengeId)`, `delete(challengeId)`

### `packages/config/src/logger.ts`
```typescript
import pino from 'pino'

export function createLogger(service: string) {
  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? 'info',
    ...(process.env.NODE_ENV !== 'production' && {
      transport: { target: 'pino-pretty', options: { colorize: true } }
    })
  })
}
```

### `packages/config/src/env.ts`
```typescript
import { z } from 'zod'

export function createEnvSchema<T extends z.ZodRawShape>(shape: T) {
  const schema = z.object(shape)
  return function validateEnv(env = process.env): z.infer<typeof schema> {
    const result = schema.safeParse(env)
    if (!result.success) {
      console.error('Invalid environment variables:', result.error.flatten().fieldErrors)
      process.exit(1)
    }
    return result.data
  }
}
```

Each service calls this with its own required vars. Example in auth-service:
```typescript
const env = createEnvSchema({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  DM_PASSWORD: z.string().min(8),
  OPENROUTER_API_KEY: z.string().min(1),
})()
```

---

## Key implementation notes

1. `packages/domain` has zero runtime dependencies — the `tsconfig.json` must compile to CJS for Node16 module resolution.
2. Use `Object.setPrototypeOf(this, new.target.prototype)` in `AppError` — without it, `instanceof AppError` checks fail in transpiled code.
3. All port interfaces use only types from `packages/domain/src/entities/` — no external type imports.
4. Export everything from `packages/domain/src/index.ts` for clean imports: `import { Character, AppError } from '@valkaria/domain'`

---

## Acceptance check

```bash
npm run build -w @valkaria/domain
npm run build -w @valkaria/shared
npm run build -w @valkaria/config
npm run typecheck
```

All must exit 0. The `dist/` directory in each package must contain `.js` and `.d.ts` files.
