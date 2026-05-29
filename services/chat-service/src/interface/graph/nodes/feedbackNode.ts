import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

export async function feedbackNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const playerId = state.sessionContext?.playerId
  const npcName = state.slots.characterName as string
  const helpful = state.slots.feedbackSentiment === 'positive'

  if (!playerId || !npcName) {
    return { actionSuccess: false, actionError: 'Missing player or NPC context' }
  }

  try {
    await deps.affinityRepository.saveFeedback(playerId, npcName, helpful)
    return { actionSuccess: true }
  } catch (error) {
    return { actionSuccess: false, actionError: (error as Error).message }
  }
}
