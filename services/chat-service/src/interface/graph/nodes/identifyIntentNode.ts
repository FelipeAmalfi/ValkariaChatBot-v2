import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import { getSystemPrompt, getUserPromptTemplate } from '../../../shared/prompts/v1/identifyIntent.js'
import type { Intent, Slots, Complexity } from '../../../shared/prompts/v1/identifyIntent.js'

interface ClassificationResult {
  intent: Intent
  slots: Partial<Slots>
  confidence: number
  complexity: Complexity
  requiresRetrieval: boolean
}

const FALLBACK: ClassificationResult = {
  intent: 'unknown',
  slots: {},
  confidence: 0,
  complexity: 'simple',
  requiresRetrieval: false,
}

function parseClassification(raw: string): ClassificationResult {
  const stripped = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const parsed = JSON.parse(stripped) as ClassificationResult
  return parsed
}

export function identifyIntentNode(deps: GraphDependencies) {
  return async function (state: ValkáriaState): Promise<Partial<ValkáriaState>> {
    try {
      const sessionSummary = state.sessionContext?.recentContext?.slice(-3).join(' | ')
      const { content } = await deps.aiProvider.complete(
        [
          { role: 'system', content: getSystemPrompt() },
          { role: 'user', content: getUserPromptTemplate(state.message, sessionSummary) },
        ],
        'classification',
        0.1,
        512,
      )

      const result = parseClassification(content)

      return {
        intent: result.intent,
        slots: result.slots ?? {},
        confidence: result.confidence,
        complexity: result.complexity,
        requiresRetrieval: result.requiresRetrieval,
        actionSuccess: null as unknown as undefined,
        actionError: undefined,
        actionData: undefined,
      }
    } catch {
      return {
        ...FALLBACK,
        actionSuccess: null as unknown as undefined,
        actionError: undefined,
        actionData: undefined,
      }
    }
  }
}
