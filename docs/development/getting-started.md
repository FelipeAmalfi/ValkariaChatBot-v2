# Getting Started

## Prerequisites

Before you begin:

- Node.js 20+
- Docker Desktop (v4+, with Compose v2)
- An OpenRouter API key (free tier works): https://openrouter.ai

## Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/FelipeAmalfi/ValkariaChatBot-v2.git
cd ValkariaChatBot-v2

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET, DM_PASSWORD, OPENROUTER_API_KEY

# 4. Start infrastructure (PostgreSQL, Redis, Neo4j, Nginx)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Seed the database (NPC and location data)
npx tsx infrastructure/scripts/seed.ts

# 6. Start all services
npm run dev
```

Services will be available at:
- Web UI: http://localhost:3000
- API Gateway: http://localhost:80
- auth-service: http://localhost:3002
- chat-service: http://localhost:3003
- world-service: http://localhost:3004 (GraphQL playground at `/graphql`)

## Project Structure

```
valkaria-v2/
├── services/
│   ├── auth-service/       Fastify, port 3002
│   ├── chat-service/       Fastify + LangGraph, port 3003
│   ├── world-service/      Fastify + Mercurius, port 3004
│   └── ingestion-worker/   CLI script (no HTTP server)
├── gateway/
│   └── nginx.conf          Reverse proxy, port 80
├── apps/
│   └── web/                Next.js 15, port 3000
├── packages/
│   ├── domain/             Shared entities, errors, ports
│   ├── shared/             Shared TypeScript primitives
│   └── config/             Shared Pino logger + Zod env factory
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── data/
│   │   ├── npcs.csv
│   │   └── locations.csv
│   └── scripts/
│       └── seed.ts
├── docs/                   This documentation site
└── spec/                   Build blueprint (phases 01–21)
```

## Common Commands

```bash
npm run dev          # Start all services in parallel
npm test             # Run all tests
npm run typecheck    # TypeScript check across all packages
npm run build        # Build all packages

# Documentation
npm run docs:dev     # VitePress dev server (http://localhost:5173)
npm run docs:build   # Build static docs
npm run docs:preview # Preview built docs

# Infrastructure
docker compose -f infrastructure/docker/docker-compose.yml up -d    # Start infra
docker compose -f infrastructure/docker/docker-compose.yml down     # Stop infra

# Data seeding
npx tsx infrastructure/scripts/seed.ts   # Seed NPC/location data
```

## Phase Map

The project was built in 21 phases. Each phase spec is in `spec/phases/`:

| Phase | Name | Service |
|---|---|---|
| 01 | Monorepo Foundation | root |
| 02 | Shared Packages | packages/* |
| 03 | Infrastructure Layer | packages/database |
| 04 | Auth Service | services/auth-service |
| 05 | World Service | services/world-service |
| 06 | Data Ingestion | services/ingestion-worker |
| 07–10 | Chat Service | services/chat-service |
| 11 | API Gateway | gateway/ |
| 12–17 | Web App | apps/web |
| 18 | Observability | all services |
| 19 | Testing | all |
| 20 | Deployment | CI/CD |
| 21 | Documentation | docs/ |

## Key Concepts

**Why narrative auth?**
Players authenticate by describing their character's background. The system embeds their answer and compares it to the registered profile via cosine similarity (threshold: 0.6). No passwords — full RPG immersion. See [ADR-001](/architecture/decisions#adr-001-narrative-authentication-for-players).

**Why PostgresSaver (not MemorySaver)?**
`MemorySaver` stores LangGraph state in process memory — one instance only. `PostgresSaver` persists state to PostgreSQL, allowing multiple chat-service instances to run simultaneously. See [ADR-002](/architecture/decisions#adr-002-postgressaver-for-langgraph-not-memorysaver).

**Why microservices?**
chat-service scales independently (LLM calls are expensive), world-service is read-heavy and cacheable, auth-service is stateless. See [Architecture Overview](/architecture/overview).
