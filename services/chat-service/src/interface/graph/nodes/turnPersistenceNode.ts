import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

async function updateAffinityIfApplicable(state: ValkáriaState, deps: GraphDependencies): Promise<void> {
  const playerId = state.sessionContext?.playerId
  const role = state.sessionContext?.role
  if (!playerId || role !== 'PLAYER') return

  const npcName = (state.slots.characterName ?? state.slots.affinityTarget)?.trim()
  if (!npcName) return

  const existing = await deps.affinityRepository.findByPlayerAndNpc(playerId, npcName)
  if (existing) {
    await deps.affinityRepository.updateScore(existing.id, 1)
  } else {
    await deps.affinityRepository.upsert({
      playerId,
      npcName,
      level: 'none',
      score: 0,
      interactionCount: 0,
      lastInteraction: new Date().toISOString(),
    })
  }
}

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

  try {
    await updateAffinityIfApplicable(state, deps)
  } catch { /* intentionally ignored */ }

  return {}
}
