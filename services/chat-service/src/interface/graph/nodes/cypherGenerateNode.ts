import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import { getSystemPrompt, getUserPromptTemplate } from '../../../shared/prompts/v1/generateCypher.js'

function parseCypherResponse(content: string): string[] {
  const stripped = content
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const parsed = JSON.parse(stripped) as unknown
  if (!Array.isArray(parsed)) return []
  return parsed.filter((q): q is string => typeof q === 'string')
}

export async function cypherGenerateNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  try {
    const { content } = await deps.aiProvider.complete(
      [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: getUserPromptTemplate(state.intent!, state.slots) },
      ],
      'cypher',
      0.2,
      1024,
    )

    const queries = parseCypherResponse(content)
    return { cypherQueries: queries.slice(0, 5), cypherRetryCount: 0 }
  } catch {
    return { cypherQueries: [], cypherRetryCount: 0 }
  }
}
