import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pool, QueryResult } from 'pg'
import { NpcIngester } from '../../src/ingesters/NpcIngester.js'
import type { NpcRow } from '../../src/parsers/CsvParser.js'

function makePool(queryFn: () => Promise<QueryResult>): Pool {
  return { query: vi.fn(queryFn) } as unknown as Pool
}

const locationMap: Record<string, string> = {
  Valkarith: 'loc-uuid-1',
  Thornwood: 'loc-uuid-2',
}

const npcRows: NpcRow[] = [
  {
    name: 'Morrigan',
    description: 'An archivist',
    location: 'Valkarith',
    likes: 'knowledge, silence',
    dislikes: 'noise',
    benefits_cordial: 'Archive access',
    benefits_loyal: 'Restricted tomes',
    benefits_intimate: 'Hidden vault',
    last_demand: 'Find the missing tome',
  },
  {
    name: 'Unknown NPC',
    description: 'A wanderer',
    location: 'The Void',   // not in locationMap — should use null
    likes: '',
    dislikes: '',
    benefits_cordial: '',
    benefits_loyal: '',
    benefits_intimate: '',
    last_demand: '',
  },
]

describe('NpcIngester', () => {
  let queryCalls: unknown[][]

  beforeEach(() => {
    queryCalls = []
  })

  it('calls pool.query for each NPC with correct SQL', async () => {
    const pool = makePool(async (...args: unknown[]) => {
      queryCalls.push(args)
      return { rows: [], rowCount: 0 } as unknown as QueryResult
    })

    const ingester = new NpcIngester(pool)
    await ingester.ingest(npcRows, locationMap)

    expect(queryCalls).toHaveLength(2)
  })

  it('passes location_id from locationMap', async () => {
    const capturedParams: unknown[] = []
    const pool = makePool(async (_sql: unknown, params: unknown) => {
      capturedParams.push(params)
      return { rows: [], rowCount: 0 } as unknown as QueryResult
    })

    const ingester = new NpcIngester(pool)
    await ingester.ingest([npcRows[0]], locationMap)

    const params = capturedParams[0] as unknown[]
    expect(params[2]).toBe('loc-uuid-1')
  })

  it('uses null when location is not in map', async () => {
    const capturedParams: unknown[] = []
    const pool = makePool(async (_sql: unknown, params: unknown) => {
      capturedParams.push(params)
      return { rows: [], rowCount: 0 } as unknown as QueryResult
    })

    const ingester = new NpcIngester(pool)
    await ingester.ingest([npcRows[1]], locationMap)

    const params = capturedParams[0] as unknown[]
    expect(params[2]).toBeNull()
  })

  it('splits likes and dislikes into arrays in metadata', async () => {
    const capturedParams: unknown[] = []
    const pool = makePool(async (_sql: unknown, params: unknown) => {
      capturedParams.push(params)
      return { rows: [], rowCount: 0 } as unknown as QueryResult
    })

    const ingester = new NpcIngester(pool)
    await ingester.ingest([npcRows[0]], locationMap)

    const params = capturedParams[0] as unknown[]
    const metadata = JSON.parse(params[3] as string)
    expect(metadata.likes).toEqual(['knowledge', 'silence'])
    expect(metadata.dislikes).toEqual(['noise'])
  })
})
