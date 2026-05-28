# ValkáriaV2 — System Architecture

## Overview

ValkáriaV2 is a **microservices monorepo** for an RPG chatbot where players interact with intelligent NPCs in a fantasy world (Candessah, city of rest in the world of Valkária). Each service is independently deployable and scalable.

---

## System Topology

```
                        ┌─────────────────────────┐
         Browser ──────▶│      Nginx Gateway       │
         (web app)      │  :80 → routes by /path   │
                        │  rate-limit: 100 req/min  │
                        │  X-Request-ID injection   │
                        └────────┬────────┬─────────┘
                                 │        │
           ┌─────────────────────┤        ├──────────────────────┐
           │                     │        │                      │
    ┌──────▼──────┐     ┌────────▼────┐  ┌▼────────────┐  ┌─────▼──────┐
    │ auth-service│     │chat-service │  │world-service│  │    web     │
    │   :3002     │     │   :3003     │  │   :3004     │  │   :3000    │
    │             │     │             │  │             │  │  Next.js   │
    │ Registration│     │ LangGraph   │  │ NPC/Location│  │  (Vercel)  │
    │ Auth flows  │     │ PostgresSvr │  │ Affinity    │  │            │
    │ JWT issuance│     │ Session mgmt│  │ GraphQL API │  │            │
    └──────┬──────┘     └────────┬────┘  └──┬──────────┘  └────────────┘
           │                     │           │
           └──────────┬──────────┘           │
                      │                      │
         ┌────────────▼──────────────────────▼───────────────┐
         │                Infrastructure                      │
         │  PostgreSQL :5432  │  Redis :6379  │  Neo4j :7687  │
         └───────────────────────────────────────────────────┘
                      │
         ┌────────────▼─────────────┐
         │    ingestion-worker      │
         │  (runs on demand, CLI)   │
         │  CSV → PG → Neo4j → vec  │
         └──────────────────────────┘
```

---

## Service Responsibilities

### Nginx Gateway (port 80)
- Single entry point for all external traffic
- Routes by URL prefix: `/auth/*` → auth-service, `/chat` → chat-service, `/graphql` → world-service, `/` → web
- Injects `X-Request-ID` header for distributed tracing
- Rate limiting: 100 req/min per IP via `limit_req`
- No business logic — pure routing and cross-cutting concerns

### auth-service (port 3002)
**Stateless — scales horizontally with zero coordination**
- Player registration: store name, class, race, background, personality, interests
- Narrative auth (players): embed a random profile field → ask a story question → validate the answer via cosine similarity (threshold 0.6)
- DM auth: simple `DM_PASSWORD` env var comparison
- JWT issuance: signs tokens with shared `JWT_SECRET`, role: `PLAYER | DM`
- No database reads during JWT verification (stateless)

### chat-service (port 3003)
**Horizontally scalable via PostgresSaver**
- Runs the LangGraph `ValkáriaGraph` — 16 nodes, 24 intents
- Every conversation turn is a stateless HTTP request: load state from PostgreSQL (via `PostgresSaver`), run graph, persist state back
- Multiple instances can run concurrently — each thread (conversation) is isolated by `thread_id`
- Redis: stores lightweight `SessionContext` (role, affinity snapshot, recent messages) for fast reads — NOT the primary state store (PostgreSQL owns that)
- Validates JWT received from client (same `JWT_SECRET`, no auth-service roundtrip)

### world-service (port 3004)
**Read-heavy — add read replicas or Redis cache as needed**
- GraphQL API (Mercurius) for all NPC, location, affinity, and player data
- 7 queries: `npc`, `npcs`, `location`, `locations`, `affinity`, `affinities`, `players` (DM only)
- 5 mutations: `registerPlayer`, `initiatePlayerAuth`, `verifyPlayerAuth`, `authenticateDM`, `updateAffinity`
- Note: auth mutations proxy to auth-service internally (or can be called directly — gateway handles routing)
- DM-only guard on `players` query via JWT role claim

### ingestion-worker (CLI, no HTTP)
- Runs on demand: `npx tsx infrastructure/scripts/seed.ts`
- 4-stage pipeline: CSV parse → PostgreSQL upsert → Neo4j graph → vector embeddings
- Idempotent: safe to re-run (uses `ON CONFLICT DO UPDATE`)
- Produces ~900 NPC records, ~100 locations, 1536-dim embeddings per NPC

### web (port 3000, Vercel in production)
- Next.js 15 App Router
- Talks to gateway (not services directly)
- Dark Fantasy aesthetic: split-pane chat + world context panel
- Apollo Client for GraphQL, JWT in memory (not cookie)

---

## Data Flow: User Sends Chat Message

```
Browser
  → POST /chat {message, threadId}
  → Nginx (rate check, inject X-Request-ID)
  → chat-service
      → Validate JWT (local, no network call)
      → Load graph state from PostgreSQL (PostgresSaver)
      → Load SessionContext from Redis (fast, small payload)
      → Run LangGraph:
          sanitize → identifyIntent → sessionLoad → [route] → narrativeResponse → turnPersistence
      → Save graph state to PostgreSQL
      → Update SessionContext in Redis
  → Return {response: string}
  → Browser renders in split-pane UI
```

---

## Data Flow: Player Auth

```
Browser
  → POST /auth/register {name, class, race, background, personality, interests}
  → auth-service → store player in PostgreSQL → 201 {playerId}

  → POST /auth/initiate {playerName}
  → auth-service
      → Pick random profile field (background | personality | interests)
      → Embed field text via OpenRouter
      → Store AuthChallenge in Redis (5min TTL): {fieldEmbedding, challengeId}
      → Generate narrative question via LLM
  → Return {challengeId, question}

  → POST /auth/validate {challengeId, answer}
  → auth-service
      → Embed answer via OpenRouter
      → Load challenge from Redis
      → Cosine similarity(answerEmbedding, fieldEmbedding) ≥ 0.6?
          Yes → Issue JWT (role: PLAYER), delete challenge from Redis
          No  → 401 UnauthorizedError
```

---

## Database Schema Overview

### PostgreSQL (all services share one DB, separate table prefixes)

**auth-service owns:**
- `players` — id, name, class, race, background, personality, interests, created_at
- `player_embeddings` — player_id, embedding(vector[1536]), drift_alpha, interaction_count

**world-service owns:**
- `characters` — id, name, description, role, faction, location_id, metadata(JSONB)
- `locations` — id, name, description, services(text[])
- `npc_affinity` — id, player_id, npc_name, level(enum), score(0-100), interaction_count
- `interaction_history` — player_id, npc_name, location_name, intent, sentiment, message_summary
- `recommendation_feedback` — player_id, npc_name, helpful(bool), created_at
- `langchain_pg_embedding` — uuid, collection_id, embedding(vector[1536]), document, cmetadata(JSONB)

**chat-service owns:**
- `memory_summaries` — thread_id, player_id, summary, turn_count, updated_at
- `checkpoints` (auto) — managed by PostgresSaver from @langchain/langgraph-checkpoint-postgres

### Redis (namespaced keys)
- `session:{threadId}` → SessionContext JSON, TTL 24h
- `auth_challenge:{challengeId}` → AuthChallenge JSON, TTL 5min
- `rate_limit:*` → nginx-managed (not application-level)

### Neo4j
- Nodes: `:NPC {name, faction, role}`, `:Location {name}`, `:Interest {name}`
- Relationships: `(NPC)-[:LOCATED_IN]->(Location)`, `(NPC)-[:LIKES]->(Interest)`
- Used by: chat-service (Cypher generation), world-service (relationship queries)

---

## Scaling Strategy

### Horizontal Scaling

| Service | Scale-out strategy | Bottleneck |
|---|---|---|
| auth-service | Add instances behind load balancer (stateless) | OpenRouter embed calls |
| chat-service | Add instances — PostgresSaver handles state coordination | OpenRouter LLM calls, Neo4j connections |
| world-service | Add instances + Redis query cache | PostgreSQL read throughput |
| web | Vercel edge (automatic) | None at our scale |

### Vertical Scaling

| Service | Resource profile | Scale up when |
|---|---|---|
| chat-service | High memory (LangGraph + LLM buffers) | P95 response time > 10s |
| world-service | Low CPU, moderate I/O | DB connection pool exhausted |
| auth-service | Very low resources | 500 concurrent registrations |

### Critical Scaling Note
`PostgresSaver` is what makes chat-service horizontally scalable. Never revert to `MemorySaver` in production — it stores state in process heap and breaks multi-instance deploys.

---

## Service Communication

All inter-service communication goes through the gateway (north-south). Services do NOT call each other directly in V2 — this avoids circular dependencies and keeps network topology simple.

Exception: `ingestion-worker` calls PostgreSQL, Neo4j, and OpenRouter directly (it's a one-off CLI tool, not a long-running service).

---

## Monorepo Workspace Layout

```
services/auth-service/     @valkaria/auth-service
services/chat-service/     @valkaria/chat-service
services/world-service/    @valkaria/world-service
services/ingestion-worker/ @valkaria/ingestion-worker
apps/web/                  @valkaria/web
packages/domain/           @valkaria/domain
packages/shared/           @valkaria/shared
packages/config/           @valkaria/config
```

Turborepo pipeline (from root `turbo.json`):
- `build`: shared → domain → config → database → all services → web
- `dev`: all services + web in parallel
- `test`, `typecheck`, `lint`: per workspace, cached
