import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import {
  getSystemPrompt,
  getUserPromptTemplate,
  parsePlanResponse,
} from '../../../shared/prompts/v1/generatePlan.js'

export async function plannerNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const { content } = await deps.aiProvider.complete(
    [
      { role: 'system', content: getSystemPrompt() },
      {
        role: 'user',
        content: getUserPromptTemplate(
          state.intent!,
          state.slots,
          state.message,
        ),
      },
    ],
    'plan',
    0.2,
    512,
  )

  const plan = parsePlanResponse(content)
  return { plannerPlan: { steps: plan.steps.slice(0, 4) } }
}
