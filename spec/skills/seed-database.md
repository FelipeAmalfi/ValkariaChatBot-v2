---
name: seed-database
description: Initialize the database with NPC and location data from CSV files. Run after phase 06 (data ingestion) is complete or whenever the database needs to be reset.
---

## Purpose
Populate PostgreSQL, Neo4j, and pgvector with the full NPC and location dataset from CSV files. The ingestion is idempotent — safe to re-run without creating duplicates.

## Prerequisites
- Docker infrastructure must be running
- `.env` file must be filled with correct values
- Phase 06 (data ingestion) must be complete

## Steps

1. **Verify Docker is healthy:**
```bash
docker compose ps
```
Expected output: all services show `healthy` or `running`. If any show `unhealthy`, run `docker compose restart <service-name>` first.

2. **Verify CSV data files exist:**
```bash
ls infrastructure/data/npcs.csv infrastructure/data/locations.csv
```
If missing, copy from the original project's CSV files.

3. **Run migrations first (if not already run):**
```bash
npm run migrate -w @valkaria/database
```

4. **Run the ingestion pipeline:**
```bash
npx tsx infrastructure/scripts/seed.ts
```
Expected output (5 stages):
```
[1/4] Parsing CSV files...       ✓ 127 locations, 934 NPCs
[2/4] Ingesting locations...     ✓ 127 upserted
[3/4] Ingesting NPCs...          ✓ 934 upserted, 0 errors
[4/4] Ingesting embeddings...    ✓ 934 vectors (this may take 5-15 minutes)
[5/4] Building Neo4j graph...    ✓ 934 NPC nodes, 127 Location nodes, 2847 LIKES relationships
Seeding complete.
```

Note: embedding generation calls OpenRouter for each NPC. With rate limiting, this takes 5-15 minutes for ~934 NPCs.

5. **Verify results:**

PostgreSQL:
```sql
SELECT 
  (SELECT COUNT(*) FROM locations) as locations,
  (SELECT COUNT(*) FROM characters) as npcs,
  (SELECT COUNT(*) FROM langchain_pg_embedding) as embeddings;
```
Expected: `127 | 934 | 934` (approximately)

Neo4j (run via Cypher shell or browser):
```cypher
MATCH (n) RETURN labels(n)[0] as label, count(n) as count
```
Expected: `NPC: 934, Location: ~127, Interest: variable`

## Troubleshooting

**Embedding step hangs**: OpenRouter rate limit hit. The script should handle backoff automatically. If it hangs > 30 minutes, Ctrl+C and re-run — the `ON CONFLICT DO UPDATE` ensures it resumes from where it stopped.

**Neo4j connection refused**: Check `NEO4J_URI=bolt://localhost:7687` in `.env`. Default Neo4j Docker password is set via `NEO4J_AUTH=neo4j/valkaria-neo4j-pass` in docker-compose.

**pgvector extension error**: Run `CREATE EXTENSION IF NOT EXISTS vector;` manually in PostgreSQL if the migration didn't create it.
