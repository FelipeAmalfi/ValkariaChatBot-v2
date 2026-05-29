import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { RetrievedDocument } from '@valkaria/domain'

async function loadPlayerEmbedding(
  deps: GraphDependencies,
  playerId: string,
): Promise<number[] | null> {
  const player = await deps.playerRepository.findById(playerId)
  if (!player) return null
  const profileText = [
    player.background,
    player.personality,
    player.interests,
    player.class,
    player.race,
  ]
    .filter(Boolean)
    .join('. ')
  return deps.aiProvider.embed(profileText)
}

export async function recommendationNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const playerId = state.sessionContext?.playerId

  let candidates: RetrievedDocument[]
  if (playerId) {
    const playerEmbedding = await loadPlayerEmbedding(deps, playerId)
    candidates = playerEmbedding
      ? await deps.vectorRetriever.search(playerEmbedding, { type: 'npc' }, 10)
      : await deps.loreQueryService.search('NPC recomendado para jogador', 10)
  } else {
    candidates = await deps.loreQueryService.search('NPC interessante', 10)
  }

  const intimateNames = new Set(
    state.sessionContext?.affinityContext
      .filter(a => a.level === 'intimate')
      .map(a => a.npcName),
  )
  const filtered = candidates.filter(c => !intimateNames.has(c.metadata?.name as string))

  if (playerId) {
    const weights = await deps.affinityRepository.getFeedbackWeights(playerId)
    filtered.sort((a, b) => {
      const wa = weights[a.metadata?.name as string] ?? 0
      const wb = weights[b.metadata?.name as string] ?? 0
      return b.score + wb - (a.score + wa)
    })
  }

  const top3 = filtered.slice(0, 3)
  const recommendationContext = top3.map(doc => doc.document).join('\n\n')

  return { recommendationContext }
}
