# ValkáriaV2 — Tech Stack

Exact packages and versions to install per workspace. Use these versions — do not auto-upgrade without testing.

---

## Root / Monorepo

```json
{
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

**turbo.json pipeline:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":   { "persistent": true, "cache": false },
    "test":  { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint":  {}
  }
}
```

**Root tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

## packages/domain

Zero runtime dependencies. Types only.

```json
{
  "name": "@valkaria/domain",
  "devDependencies": {
    "typescript": "*"
  }
}
```

---

## packages/shared

```json
{
  "name": "@valkaria/shared",
  "devDependencies": {
    "typescript": "*"
  }
}
```

---

## packages/config

```json
{
  "name": "@valkaria/config",
  "dependencies": {
    "zod": "^3.24.0",
    "pino": "^9.5.0",
    "pino-pretty": "^13.0.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0",
    "typescript": "*"
  }
}
```

---

## packages/database

```json
{
  "name": "@valkaria/database",
  "dependencies": {
    "pg": "^8.13.0",
    "neo4j-driver": "^5.27.0",
    "ioredis": "^5.4.0",
    "pgvector": "^0.2.0",
    "@valkaria/domain": "*",
    "@valkaria/config": "*"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "typescript": "*"
  }
}
```

---

## services/auth-service

```json
{
  "name": "@valkaria/auth-service",
  "dependencies": {
    "fastify": "^5.2.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "@fastify/rate-limit": "^10.0.0",
    "zod": "^3.24.0",
    "openai": "^4.77.0",
    "@valkaria/domain": "*",
    "@valkaria/config": "*",
    "@valkaria/database": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "vitest": "^3.0.0",
    "@types/node": "*"
  }
}
```

**Why `openai` package for OpenRouter?** OpenRouter is OpenAI-API-compatible. Using the official `openai` package with `baseURL: "https://openrouter.ai/api/v1"` is the recommended approach. No extra dependencies needed.

---

## services/world-service

```json
{
  "name": "@valkaria/world-service",
  "dependencies": {
    "fastify": "^5.2.0",
    "@mercuriusjs/mercurius": "^15.0.0",
    "graphql": "^16.9.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "zod": "^3.24.0",
    "@valkaria/domain": "*",
    "@valkaria/config": "*",
    "@valkaria/database": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "vitest": "^3.0.0",
    "@types/node": "*"
  }
}
```

---

## services/chat-service

```json
{
  "name": "@valkaria/chat-service",
  "dependencies": {
    "fastify": "^5.2.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/helmet": "^12.0.0",
    "@langchain/langgraph": "^0.2.47",
    "@langchain/langgraph-checkpoint-postgres": "^0.0.13",
    "@langchain/core": "^0.3.30",
    "openai": "^4.77.0",
    "zod": "^3.24.0",
    "@valkaria/domain": "*",
    "@valkaria/config": "*",
    "@valkaria/database": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "vitest": "^3.0.0",
    "@types/node": "*"
  }
}
```

---

## services/ingestion-worker

```json
{
  "name": "@valkaria/ingestion-worker",
  "dependencies": {
    "openai": "^4.77.0",
    "csv-parse": "^5.6.0",
    "zod": "^3.24.0",
    "@valkaria/domain": "*",
    "@valkaria/config": "*",
    "@valkaria/database": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "tsx": "^4.19.0",
    "@types/node": "*"
  }
}
```

---

## apps/web

```json
{
  "name": "@valkaria/web",
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@apollo/client": "^3.12.0",
    "graphql": "^16.9.0",
    "framer-motion": "^12.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/forms": "^0.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.474.0"
  },
  "devDependencies": {
    "typescript": "*",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@playwright/test": "^1.49.0",
    "vitest": "^3.0.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

**shadcn/ui**: Initialize with `npx shadcn@latest init` inside `apps/web/`, then add components individually. Do NOT add all components at once — only add what each phase spec requires.

---

## Infrastructure

### Docker Images (docker-compose.yml)
```yaml
postgres:   postgres:15-alpine with pgvector extension
neo4j:      neo4j:5.26-community
redis:      redis:7-alpine
nginx:      nginx:1.27-alpine
```

### Dev Tools
- **tsx**: for running TypeScript scripts directly (`npx tsx infrastructure/scripts/seed.ts`)
- **pino-pretty**: human-readable logs in development (`pino().pipe(pinoPretty())`)

---

## Model Configuration (via OpenRouter)

All services that call OpenRouter use the `openai` package with these defaults:

| Task | Model | Temperature | Max Tokens |
|---|---|---|---|
| chat/narrative | `mistralai/mistral-7b-instruct:free` | 0.7 | 1024 |
| classification/intent | `mistralai/mistral-7b-instruct:free` | 0.1 | 512 |
| cypher generation | `mistralai/mistral-7b-instruct:free` | 0.2 | 1024 |
| plan generation | `mistralai/mistral-7b-instruct:free` | 0.2 | 512 |
| embedding | `text-embedding-3-small` | — | — |
| fallback | `google/gemma-3-1b-it:free` | 0.7 | 512 |

All models configurable via environment variables (see `ENVIRONMENT.md`). Override per task in `packages/config/src/modelConfig.ts`.

---

## Why These Choices?

| Choice | Rationale |
|---|---|
| Fastify v5 | 2-3x faster than Express, native TypeScript, lifecycle hooks match clean architecture |
| Mercurius | Native Fastify GraphQL, ~30% faster than Apollo Server |
| LangGraph | Explicit state machine beats ad-hoc chains — debuggable, resumable, testable |
| PostgresSaver | Enables horizontal scaling of chat-service (vs MemorySaver which is in-process) |
| `openai` pkg + OpenRouter | OpenRouter is API-compatible, cheaper, model-agnostic — single client handles all LLM tasks |
| ioredis | Faster and more feature-complete than `redis` npm package |
| pgvector | Co-locate embeddings with relational data — one less infrastructure piece |
| Vitest | Faster than Jest, native ESM, compatible with our Node16 module system |
| Framer Motion | Best animation library for React, handles presence animations cleanly |
| Tailwind v4 | CSS-first config, faster builds, better DX than v3 |
