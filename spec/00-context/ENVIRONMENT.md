# ValkáriaV2 — Environment Variables

All services read from a single `.env` file at the repo root in development. In production, each service loads only its own vars.

Copy `.env.example` to `.env` and fill in required values before running any service.

---

## Required Variables (all services need these)

| Variable | Example | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | Yes | `development` \| `production` \| `test` |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/valkaria` | Yes | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Yes | Redis connection string |

---

## auth-service

| Variable | Example | Required | Description |
|---|---|---|---|
| `AUTH_PORT` | `3002` | No (default: 3002) | HTTP port |
| `JWT_SECRET` | `super-secret-32-char-string-here` | Yes | Min 32 chars. Generate: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `24h` | No (default: 24h) | JWT token lifetime |
| `DM_PASSWORD` | `my-dm-password-2024` | Yes | Min 8 chars. DM login password |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Yes | From https://openrouter.ai |
| `SEMANTIC_AUTH_THRESHOLD` | `0.6` | No (default: 0.6) | Cosine similarity threshold for player auth. Range: 0.0–1.0 |
| `FRONTEND_URL` | `http://localhost:3000` | Yes | CORS allowed origin |

---

## chat-service

| Variable | Example | Required | Description |
|---|---|---|---|
| `CHAT_PORT` | `3003` | No (default: 3003) | HTTP port |
| `JWT_SECRET` | `super-secret-32-char-string-here` | Yes | **Must match auth-service** |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Yes | From https://openrouter.ai |
| `NEO4J_URI` | `bolt://localhost:7687` | Yes | Neo4j Bolt connection string |
| `NEO4J_USER` | `neo4j` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | `your-neo4j-password` | Yes | Neo4j password |
| `FRONTEND_URL` | `http://localhost:3000` | Yes | CORS allowed origin |
| `AI_DEFAULT_MODEL` | `mistralai/mistral-7b-instruct:free` | No | Default OpenRouter model |
| `AI_CHAT_MODEL` | `mistralai/mistral-7b-instruct:free` | No | Model for narrative responses |
| `AI_CLASSIFICATION_MODEL` | `mistralai/mistral-7b-instruct:free` | No | Model for intent classification |
| `AI_CYPHER_MODEL` | `mistralai/mistral-7b-instruct:free` | No | Model for Cypher generation |
| `AI_PLAN_MODEL` | `mistralai/mistral-7b-instruct:free` | No | Model for plan generation |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small` | No | Model for embeddings |
| `AI_EMBEDDING_DIMENSIONS` | `1536` | No (default: 1536) | Embedding vector dimensions |
| `AI_FALLBACK_MODEL` | `google/gemma-3-1b-it:free` | No | Fallback model on errors |

---

## world-service

| Variable | Example | Required | Description |
|---|---|---|---|
| `WORLD_PORT` | `3004` | No (default: 3004) | HTTP port |
| `JWT_SECRET` | `super-secret-32-char-string-here` | Yes | **Must match auth-service** |
| `NEO4J_URI` | `bolt://localhost:7687` | Yes | Neo4j Bolt connection string |
| `NEO4J_USER` | `neo4j` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | `your-neo4j-password` | Yes | Neo4j password |
| `FRONTEND_URL` | `http://localhost:3000` | Yes | CORS allowed origin |

---

## ingestion-worker

| Variable | Example | Required | Description |
|---|---|---|---|
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | Yes | For generating embeddings |
| `NEO4J_URI` | `bolt://localhost:7687` | Yes | Neo4j connection |
| `NEO4J_USER` | `neo4j` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | `your-neo4j-password` | Yes | Neo4j password |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small` | No | Embedding model |
| `AI_EMBEDDING_DIMENSIONS` | `1536` | No | Vector dimensions |

---

## apps/web

| Variable | Example | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:80` | Yes | Gateway URL (dev: port 80, prod: your domain) |
| `NEXT_PUBLIC_GRAPHQL_URL` | `http://localhost:80/graphql` | Yes | GraphQL endpoint through gateway |

---

## .env.example (copy this to .env)

```bash
# ─── SHARED ───────────────────────────────────────────────
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/valkaria
REDIS_URL=redis://localhost:6379

# ─── AUTH ─────────────────────────────────────────────────
AUTH_PORT=3002
JWT_SECRET=change-me-to-32-char-minimum-secret
JWT_EXPIRES_IN=24h
DM_PASSWORD=change-me-min-8-chars
SEMANTIC_AUTH_THRESHOLD=0.6

# ─── OPENROUTER (shared by auth, chat, ingestion) ─────────
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# ─── CHAT ─────────────────────────────────────────────────
CHAT_PORT=3003
AI_DEFAULT_MODEL=mistralai/mistral-7b-instruct:free
AI_CHAT_MODEL=mistralai/mistral-7b-instruct:free
AI_CLASSIFICATION_MODEL=mistralai/mistral-7b-instruct:free
AI_CYPHER_MODEL=mistralai/mistral-7b-instruct:free
AI_PLAN_MODEL=mistralai/mistral-7b-instruct:free
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_EMBEDDING_DIMENSIONS=1536
AI_FALLBACK_MODEL=google/gemma-3-1b-it:free

# ─── WORLD ────────────────────────────────────────────────
WORLD_PORT=3004

# ─── NEO4J (shared by chat, world, ingestion) ─────────────
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=valkaria-neo4j-pass

# ─── CORS ─────────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000

# ─── WEB ──────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:80
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:80/graphql
```

---

## Production Variables

For production, split variables per service and configure in each hosting platform:

### Render (auth-service, chat-service, world-service)
Add only the variables each service needs. Never add `DATABASE_URL` to web service.

### Vercel (apps/web)
Only add `NEXT_PUBLIC_*` variables. Use production API domain for `NEXT_PUBLIC_API_URL`.

### Production-specific values
```bash
NODE_ENV=production
DATABASE_URL=<supabase-connection-string>
REDIS_URL=<upstash-redis-url>
NEO4J_URI=neo4j+s://<neo4j-aura-id>.databases.neo4j.io
FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_GRAPHQL_URL=https://api.your-domain.com/graphql
```

---

## Notes

- `JWT_SECRET` **must be identical** across auth-service, chat-service, and world-service. They all verify tokens signed by auth-service.
- `OPENROUTER_API_KEY` is the only paid external service. The free tier models (`mistralai/mistral-7b-instruct:free`) work for development with no cost.
- Neo4j Aura Free tier supports 200,000 nodes — sufficient for ~900 NPCs + relationships.
- Upstash Redis free tier: 256MB — sufficient for session storage at development scale.
