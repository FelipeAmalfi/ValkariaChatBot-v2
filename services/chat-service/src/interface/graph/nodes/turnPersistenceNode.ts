import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

export async function turnPersistenceNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const threadId = state.sessionContext?.threadId
  if (!threadId) return {}

  const messageText = state.message

  try {
    await deps.memoryEngine.append(threadId, messageText)
  } catch { /* intentionally ignored */ }

  try {
    const updatedContext = {
      ...state.sessionContext!,
      recentContext: [
        ...(state.sessionContext?.recentContext ?? []).slice(-4),
        messageText,
      ].slice(-5),
    }
    await deps.sessionStore.save(threadId, updatedContext)
  } catch { /* intentionally ignored */ }

  return {}
}
