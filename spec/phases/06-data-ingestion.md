# Phase 06 — Data Ingestion

**Agent**: `database` + `ai-provider`  
**Depends on**: Phase 03, 04 (for OpenRouterProvider pattern)  
**Service**: `services/ingestion-worker/` (CLI, no HTTP server)

---

## What you're building

A one-shot CLI pipeline that reads NPC and location data from CSV files and populates PostgreSQL, Neo4j, and the pgvector embedding store. The pipeline is idempotent — re-running it updates existing records rather than creating duplicates. This is the foundation for all AI-powered queries.

---

## Directory structure

```
services/ingestion-worker/
├── src/
│   ├── parsers/
│   │   └── CsvParser.ts
│   ├── ingesters/
│   │   ├── LocationIngester.ts
│   │   ├── NpcIngester.ts
│   │   ├── EmbeddingIngester.ts
│   │   └── Neo4jIngester.ts
│   ├── infrastructure/
│   │   └── ai/
│   │       └── OpenRouterProvider.ts
│   └── pipeline.ts
├── tests/
│   └── unit/
│       ├── CsvParser.test.ts
│       └── NpcIngester.test.ts
├── package.json
└── tsconfig.json

infrastructure/
├── data/
│   ├── npcs.csv        (copy from original project root)
│   └── locations.csv   (copy from original project root)
└── scripts/
    └── seed.ts         (entry point that runs the pipeline)
```

---

## Packages to install

```bash
npm install openai csv-parse zod \
  @valkaria/domain @valkaria/config @valkaria/database \
  -w @valkaria/ingestion-worker

npm install -D tsx @types/node vitest -w @valkaria/ingestion-worker
```

---

## CSV Format

Both CSVs use semicolons as delimiter:

```
# npcs.csv (header + data rows)
name;description;location;likes;dislikes;benefits_cordial;benefits_loyal;benefits_intimate;last_demand

# locations.csv
name;description;services
```

---

## Files to create

### `src/parsers/CsvParser.ts`
```typescript
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

export interface NpcRow {
  name: string
  description: string
  location: string
  likes: string      // comma-separated
  dislikes: string   // comma-separated
  benefits_cordial: string
  benefits_loyal: string
  benefits_intimate: string
  last_demand: string
}

export interface LocationRow {
  name: string
  description: string
  services: string   // comma-separated
}

export class CsvParser {
  parseNpcs(filePath: string): NpcRow[] {
    const content = readFileSync(filePath, 'utf-8')
    return parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as NpcRow[]
  }

  parseLocations(filePath: string): LocationRow[] {
    const content = readFileSync(filePath, 'utf-8')
    return parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as LocationRow[]
  }
}
```

### `src/ingesters/LocationIngester.ts`
Upserts each location row into the `locations` table using `ON CONFLICT (name) DO UPDATE`. Returns a map of `locationName → locationId` for use by `NpcIngester`.

### `src/ingesters/NpcIngester.ts`
For each NPC row:
1. Look up location ID from the location map
2. Parse `likes` and `dislikes` strings into arrays (split by comma, trim)
3. Build `metadata` JSONB object
4. Upsert into `characters` table

### `src/ingesters/EmbeddingIngester.ts`
For each NPC in the database:
1. Skip if already has an embedding in `langchain_pg_embedding` (check by `custom_id = npc.name`)
2. Build embedding text: `"${name}: ${description}. Located in ${location}. Likes: ${likes}. Personality traits: ..."` 
3. Call `aiProvider.embed(text)` to get vector[1536]
4. Insert into `langchain_pg_embedding` with `cmetadata: { type: 'npc', name, location, faction }`
5. Add 200ms delay between API calls to avoid rate limiting

### `src/ingesters/Neo4jIngester.ts`
For each NPC:
1. MERGE `:NPC {name}` node
2. MERGE `:Location {name}` node for the NPC's location
3. CREATE relationship `(NPC)-[:LOCATED_IN]->(Location)` (or MERGE to be idempotent)
4. For each like: MERGE `:Interest {name}`, CREATE `(NPC)-[:LIKES]->(Interest)`

Use batched writes (100 NPCs per transaction) for performance.

### `src/pipeline.ts`
Orchestrates all 4 stages in order with progress logging:

```typescript
export async function runPipeline(config: PipelineConfig): Promise<void> {
  console.log('[1/4] Parsing CSV files...')
  const parser = new CsvParser()
  const locationRows = parser.parseLocations(config.locationsFile)
  const npcRows = parser.parseNpcs(config.npcsFile)
  console.log(`      ✓ ${locationRows.length} locations, ${npcRows.length} NPCs`)

  console.log('[2/4] Ingesting locations...')
  const locationIngester = new LocationIngester(config.pool)
  const locationMap = await locationIngester.ingest(locationRows)
  console.log(`      ✓ ${Object.keys(locationMap).length} upserted`)

  console.log('[3/4] Ingesting NPCs...')
  const npcIngester = new NpcIngester(config.pool)
  await npcIngester.ingest(npcRows, locationMap)
  console.log(`      ✓ ${npcRows.length} upserted`)

  console.log('[4/4] Generating embeddings...')
  const embeddingIngester = new EmbeddingIngester(config.pool, config.aiProvider)
  await embeddingIngester.ingest()
  console.log(`      ✓ embeddings complete`)

  console.log('[5/4] Building Neo4j graph...')
  const neo4jIngester = new Neo4jIngester(config.driver)
  await neo4jIngester.ingest(npcRows, locationMap)
  await neo4jIngester.close()
  console.log(`      ✓ graph built`)

  console.log('\nSeeding complete.')
}
```

(Note: 5 stages despite saying "4/4" — the Neo4j stage was added after initial design. Keep the numbering as-is for user clarity.)

### `infrastructure/scripts/seed.ts`
```typescript
#!/usr/bin/env tsx
import { join } from 'path'
import { getPgPool, getNeo4jDriver } from '@valkaria/database/clients'
import { runMigrations } from '@valkaria/database/migrate'
import { OpenRouterProvider } from '@valkaria/ingestion-worker/infrastructure/ai/OpenRouterProvider'
import { runPipeline } from '@valkaria/ingestion-worker/pipeline'
import { createModelConfig } from '@valkaria/config'
import 'dotenv/config'

const pool = getPgPool(process.env.DATABASE_URL!)
const driver = getNeo4jDriver(
  process.env.NEO4J_URI!,
  process.env.NEO4J_USER!,
  process.env.NEO4J_PASSWORD!
)
const modelConfig = createModelConfig(process.env)
const aiProvider = new OpenRouterProvider(process.env.OPENROUTER_API_KEY!, modelConfig)

await runMigrations(pool)

await runPipeline({
  locationsFile: join(__dirname, '../data/locations.csv'),
  npcsFile: join(__dirname, '../data/npcs.csv'),
  pool,
  driver,
  aiProvider,
})

await pool.end()
await driver.close()
process.exit(0)
```

---

## Key implementation notes

1. Embedding generation is the slow step (~5-15 minutes for 934 NPCs on the free tier). Add a `Promise.all` batch limit of 5 concurrent requests max.
2. Check if embedding already exists before generating: `SELECT 1 FROM langchain_pg_embedding WHERE custom_id = $1`. This makes re-runs fast.
3. The `EmbeddingIngester` builds descriptive text for each NPC that combines name, description, location, and likes — this text becomes the searchable document for RAG queries.
4. Neo4j `MERGE` (not `CREATE`) prevents duplicate nodes on re-run.

---

## Acceptance check

```bash
# Ensure Docker is running
docker compose -f infrastructure/docker/docker-compose.yml ps

# Run the seed script
npx tsx infrastructure/scripts/seed.ts

# Check counts
# PostgreSQL: SELECT COUNT(*) FROM characters; → ~934
# PostgreSQL: SELECT COUNT(*) FROM langchain_pg_embedding; → ~934
# Neo4j Browser: MATCH (n:NPC) RETURN count(n); → ~934
```

Or run the `seed-database` skill which checks all three.
