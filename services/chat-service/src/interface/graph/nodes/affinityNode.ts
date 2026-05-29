import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { AffinityEntry, AffinitySnapshot } from '@valkaria/domain'

export async function affinityNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const playerId = state.sessionContext?.playerId
  if (!playerId) return { affinitySnapshot: [] }

  const target = state.slots.affinityTarget as string | undefined

  let entries: AffinityEntry[]
  if (target) {
    const entry = await deps.affinityRepository.findByPlayerAndNpc(playerId, target)
    entries = entry ? [entry] : []
  } else {
    entries = await deps.affinityRepository.findByPlayer(playerId)
  }

  const snapshot: AffinitySnapshot[] = entries.map(e => ({
    npcName: e.npcName,
    level: e.level,
    score: e.score,
  }))

  return { affinitySnapshot: snapshot }
}
