# Phase 03 — Infrastructure Layer

**Agent**: `database`  
**Depends on**: Phase 02  
**Service**: `packages/database/`

---

## What you're building

The shared database layer used by all services: PostgreSQL pool, Neo4j driver, Redis client, SQL migrations, and all repository implementations. Each service imports clients and repositories from this package — they never instantiate database connections directly.

---

## Directory structure

```
packages/database/
└── src/
    ├── clients/
    │   ├── pgPool.ts
    │   ├── neo4jDriver.ts
    │   └── redisClient.ts
    ├── migrations/
    │   ├── 001_extensions.sql
    │   ├── 002_players.sql
    │   ├── 003_locations.sql
    │   ├── 004_characters.sql
    │   ├── 005_affinity.sql
    │   ├── 006_memory.sql
    │   └── 007_embeddings.sql
    ├── migrate.ts
    ├── repositories/
    │   ├── PgCharacterRepository.ts
    │   ├── PgPlayerRepository.ts
    │   ├── PgAffinityRepository.ts
    │   ├── PgLocationRepository.ts
    │   ├── PgVectorRetriever.ts
    │   ├── PgMemoryEngine.ts
    │   └── RedisSessionContextStore.ts
    └── index.ts
```

---

## Packages to install

```bash
npm install pg pgvector neo4j-driver ioredis @valkaria/domain @valkaria/config -w @valkaria/database
npm install -D @types/pg -w @valkaria/database
```

---

## Files to create

### `src/clients/pgPool.ts`
Singleton Pool factory. Returns the same instance on repeated calls.
```typescript
import { Pool } from 'pg'

let pool: Pool | null = null

export function getPgPool(connectionString: string, options?: { max?: number }): Pool {
  if (!pool) {
    pool = new Pool({ connectionString, max: options?.max ?? 10 })
    pool.on('error', (err) => console.error('PG pool error:', err))
  }
  return pool
}
```

### `src/clients/neo4jDriver.ts`
```typescript
import neo4j, { Driver } from 'neo4j-driver'

let driver: Driver | null = null

export function getNeo4jDriver(uri: string, user: string, password: string): Driver {
  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  }
  return driver
}
```

### `src/clients/redisClient.ts`
```typescript
import Redis from 'ioredis'

let client: Redis | null = null

export function getRedisClient(url: string): Redis {
  if (!client) {
    client = new Redis(url, { lazyConnect: true })
    client.on('error', (err) => console.error('Redis error:', err))
  }
  return client
}
```

### `src/migrate.ts`
Reads all `.sql` files from `migrations/` in filename order and executes them against PostgreSQL. Uses a `schema_migrations` table to track which migrations have run.

```typescript
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { Pool } from 'pg'

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  
  const migrationsDir = join(__dirname, 'migrations')
  const files = (await readdir(migrationsDir)).filter(f => f.endsWith('.sql')).sort()
  
  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [file]
    )
    if (rows.length > 0) continue
    
    const sql = await readFile(join(migrationsDir, file), 'utf-8')
    await pool.query(sql)
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
    console.log(`Migration applied: ${file}`)
  }
}
```

### Migration files

`001_extensions.sql`:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
```

`002_players.sql`: Create `players` and `player_embeddings` tables (see `spec/agents/database.md` for exact DDL).

`003_locations.sql`: Create `locations` table.

`004_characters.sql`: Create `characters` table with foreign key to locations.

`005_affinity.sql`: Create `npc_affinity`, `interaction_history`, `recommendation_feedback` tables.

`006_memory.sql`: Create `memory_summaries` table.

`007_embeddings.sql`: Create `langchain_pg_embedding` table with IVFFlat vector index.

### Repository implementations

Implement all 7 repository classes. Each implements the corresponding port from `@valkaria/domain/ports`. Full DDL and patterns in `spec/agents/database.md`.

Key methods to implement per repository:
- **PgCharacterRepository**: `findByName`, `findMany(filters)`, `upsert`
- **PgPlayerRepository**: `findByName`, `create`, `findAll(page, pageSize)`
- **PgAffinityRepository**: `findByPlayer`, `findByPlayerAndNpc`, `upsert`, `getFeedbackWeights`
- **PgLocationRepository**: `findByName`, `findMany`
- **PgVectorRetriever**: `search(embedding, filters, topK)` — uses `1 - (embedding <=> $1)` for cosine similarity, filters by `cmetadata` JSONB
- **PgMemoryEngine**: `append(threadId, content)`, `getSummary(threadId)`, `saveSummary`
- **RedisSessionContextStore**: `load(threadId)`, `save(threadId, context)`, `delete(threadId)` — 24h TTL

---

## Key implementation notes

1. Never use `pool.query()` with string interpolation — always parameterized queries with `$1, $2`.
2. Neo4j sessions must always be closed in `finally` blocks.
3. `PgVectorRetriever.search()` uses pgvector cosine distance: `ORDER BY embedding <=> $1 LIMIT $2`. Filter threshold: `1 - (embedding <=> $1) >= 0.3`.
4. `RedisSessionContextStore` stores/retrieves JSON with 24h TTL (`EX 86400`).
5. Add `"migrate": "tsx src/migrate.ts"` to `packages/database/package.json` scripts.

---

## Environment variables needed

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/valkaria
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=valkaria-neo4j-pass
```

---

## Acceptance check

```bash
# Run migrations
npm run migrate -w @valkaria/database

# Verify tables exist (requires psql or pg client)
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# Expected: players, player_embeddings, locations, characters, npc_affinity, 
#           interaction_history, recommendation_feedback, memory_summaries,
#           langchain_pg_embedding, schema_migrations

npm run typecheck
```

Typecheck must pass with 0 errors. The `dist/` folder must contain all compiled files.
