# ingestion-worker

**Package**: `@valkaria/ingestion-worker` | **Type**: CLI (no HTTP server)

## Responsibilities

One-shot CLI pipeline that reads NPC and location data from CSV files and populates PostgreSQL, Neo4j, and the pgvector embedding store.

- 4-stage pipeline: CSV parse → PostgreSQL upsert → Neo4j graph → vector embeddings
- Idempotent: safe to re-run (uses `ON CONFLICT DO UPDATE`)
- Produces ~900 NPC records, ~100 locations, 1536-dim embeddings per NPC

**Run command:**
```bash
npx tsx infrastructure/scripts/seed.ts
```

## Pipeline Stages

### Stage 1: CSV Parse

Reads `infrastructure/data/npcs.csv` and `infrastructure/data/locations.csv`.

CSV format (semicolon delimiter):
```
# npcs.csv
name;description;location;likes;dislikes;benefits_cordial;benefits_loyal;benefits_intimate;last_demand

# locations.csv
name;description;services
```

### Stage 2: PostgreSQL Upsert

Inserts records into `characters` and `locations` tables using `ON CONFLICT DO UPDATE` for idempotency.

### Stage 3: Neo4j Graph

Creates `:NPC`, `:Location`, and `:Interest` nodes and their relationships:
- `(NPC)-[:LOCATED_IN]->(Location)`
- `(NPC)-[:LIKES]->(Interest)`

### Stage 4: Vector Embeddings

Generates 1536-dim embeddings for each NPC description via OpenRouter (`text-embedding-3-small`) and stores them in `langchain_pg_embedding` (pgvector).

## Data it populates

- `characters` (PostgreSQL) — NPC records
- `locations` (PostgreSQL) — location records
- `langchain_pg_embedding` (PostgreSQL/pgvector) — NPC embeddings
- Neo4j nodes and relationships

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEO4J_URI` | Yes | Neo4j Bolt connection string |
| `NEO4J_USER` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | Yes | Neo4j password |
| `OPENROUTER_API_KEY` | Yes | For generating embeddings |
| `AI_EMBEDDING_MODEL` | No | Embedding model (default: text-embedding-3-small) |
| `AI_EMBEDDING_DIMENSIONS` | No | Vector dimensions (default: 1536) |

## Key design decisions

- **Idempotent by design**: `ON CONFLICT DO UPDATE` in all upserts means re-running never duplicates data
- **No HTTP server**: runs as a CLI tool invoked on demand, not a long-running service
- **Direct connections**: connects to PostgreSQL, Neo4j, and OpenRouter directly (no gateway)
