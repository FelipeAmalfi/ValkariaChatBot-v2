import type { Pool } from 'pg'
import type { Driver } from 'neo4j-driver'
import type { AIProvider } from '@valkaria/domain'
import { CsvParser } from './parsers/CsvParser.js'
import { LocationIngester } from './ingesters/LocationIngester.js'
import { NpcIngester } from './ingesters/NpcIngester.js'
import { EmbeddingIngester } from './ingesters/EmbeddingIngester.js'
import { Neo4jIngester } from './ingesters/Neo4jIngester.js'

export interface PipelineConfig {
  locationsFile: string
  npcsFile: string
  pool: Pool
  driver: Driver
  aiProvider: AIProvider
}

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
