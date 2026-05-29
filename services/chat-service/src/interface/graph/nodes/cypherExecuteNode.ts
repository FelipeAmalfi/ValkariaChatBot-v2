import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

const FORBIDDEN_PATTERN = /\b(CREATE|MERGE|DELETE|DROP|SET|REMOVE|CALL|LOAD\s+CSV)\b/i

export function isSafeCypher(query: string): boolean {
  return !FORBIDDEN_PATTERN.test(query)
}

function deduplicateByName(records: unknown[]): unknown[] {
  const seen = new Set<string>()
  return records.filter(r => {
    const rec = r as Record<string, unknown>
    const name = rec['n.name'] ?? rec['name'] ?? rec['npc_name']
    if (typeof name !== 'string') return true
    if (seen.has(name)) return false
    seen.add(name)
    return true
  })
}

function formatCypherResults(records: unknown[]): string {
  if (!records.length) return 'Nenhum resultado encontrado.'
  return records
    .map(r => {
      const rec = r as Record<string, unknown>
      return Object.entries(rec)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(', ')
    })
    .join('\n')
}

export async function cypherExecuteNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const results: unknown[] = []
  const session = deps.neo4jDriver.session()

  try {
    for (const query of state.cypherQueries) {
      if (!isSafeCypher(query)) continue
      const result = await session.run(query)
      results.push(...result.records.map(r => r.toObject()))
    }

    const deduplicated = deduplicateByName(results)
    const graphContext = formatCypherResults(deduplicated)

    return {
      cypherResults: deduplicated,
      graphContext,
      cypherRetryCount: state.cypherRetryCount + 1,
      actionError: undefined,
    }
  } catch (error) {
    return {
      actionError: (error as Error).message,
      cypherRetryCount: state.cypherRetryCount + 1,
    }
  } finally {
    await session.close()
  }
}
