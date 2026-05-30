# Stack Reference

Exact packages and versions per workspace. Use these versions — do not auto-upgrade without testing.

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

Turborepo pipeline:
```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":   { "persistent": true, "cache": false },
    "test":  { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint":  {}
  }
}
```

## services/auth-service

```json
{
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
  }
}
```

## services/chat-service

```json
{
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
  }
}
```

## services/world-service

```json
{
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
  }
}
```

## services/ingestion-worker

```json
{
  "dependencies": {
    "openai": "^4.77.0",
    "csv-parse": "^5.6.0",
    "zod": "^3.24.0",
    "@valkaria/domain": "*",
    "@valkaria/config": "*",
    "@valkaria/database": "*"
  }
}
```

## apps/web

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@apollo/client": "^3.12.0",
    "graphql": "^16.9.0",
    "framer-motion": "^12.0.0",
    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.474.0"
  }
}
```

## packages/database

```json
{
  "dependencies": {
    "pg": "^8.13.0",
    "neo4j-driver": "^5.27.0",
    "ioredis": "^5.4.0",
    "pgvector": "^0.2.0"
  }
}
```

## Infrastructure Docker Images

| Service | Image |
|---|---|
| PostgreSQL | `postgres:15-alpine` + pgvector extension |
| Neo4j | `neo4j:5.26-community` |
| Redis | `redis:7-alpine` |
| Nginx | `nginx:1.27-alpine` |

## Model Configuration (via OpenRouter)

All services that call OpenRouter use the `openai` package with `baseURL: "https://openrouter.ai/api/v1"`.

| Task | Model | Temperature | Max Tokens |
|---|---|---|---|
| chat/narrative | `mistralai/mistral-7b-instruct:free` | 0.7 | 1024 |
| classification/intent | `mistralai/mistral-7b-instruct:free` | 0.1 | 512 |
| cypher generation | `mistralai/mistral-7b-instruct:free` | 0.2 | 1024 |
| plan generation | `mistralai/mistral-7b-instruct:free` | 0.2 | 512 |
| embedding | `text-embedding-3-small` | — | — |
| fallback | `google/gemma-3-1b-it:free` | 0.7 | 512 |

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
| Vitest | Faster than Jest, native ESM, compatible with Node16 module system |
| Framer Motion | Best animation library for React, handles presence animations cleanly |
| Tailwind v4 | CSS-first config, faster builds, better DX than v3 |
