import type { RunnableConfig } from '@langchain/core/runnables'
import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

export function sessionLoadNode(deps: GraphDependencies) {
  return async function (
    _state: ValkáriaState,
    config?: RunnableConfig,
  ): Promise<Partial<ValkáriaState>> {
    const threadId = config?.configurable?.thread_id as string | undefined

    if (!threadId) {
      return { sessionContext: undefined }
    }

    const existing = await deps.sessionStore.load(threadId)
    if (existing) {
      return {
        sessionContext: existing,
        playerRole: existing.role,
        playerId: existing.playerId,
      }
    }

    return { sessionContext: undefined }
  }
}
