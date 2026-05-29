import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { Character } from '@valkaria/domain'

function formatCharacter(character: Character): string {
  const lines: string[] = [`${character.name} é um(a) ${character.faction}.`]
  if (character.description) lines.push(character.description)
  if (character.metadata.likes?.length) {
    lines.push(`Gosta de: ${character.metadata.likes.join(', ')}.`)
  }
  if (character.metadata.dislikes?.length) {
    lines.push(`Não gosta de: ${character.metadata.dislikes.join(', ')}.`)
  }
  return lines.join('\n')
}

export async function retrievalOrchestratorNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const contexts: string[] = []

  for (const step of state.plannerPlan?.steps ?? []) {
    switch (step.strategy) {
      case 'character_lookup': {
        const char = await deps.characterRepository.findByName(step.target)
        if (char) contexts.push(formatCharacter(char))
        break
      }
      case 'vector': {
        const embedding = await deps.aiProvider.embed(step.target)
        const docs = await deps.vectorRetriever.search(embedding, step.filters, 3)
        contexts.push(docs.map(d => d.document).join('\n'))
        break
      }
      case 'affinity': {
        const entry = await deps.affinityRepository.findByPlayerAndNpc(
          state.sessionContext?.playerId!,
          step.target,
        )
        if (entry) contexts.push(`Afinidade com ${step.target}: ${entry.level} (${entry.score})`)
        break
      }
      case 'memory': {
        const summary = await deps.memoryEngine.getSummary(state.sessionContext?.threadId!)
        if (summary) contexts.push(`Memória da sessão: ${summary}`)
        break
      }
    }
  }

  return { retrievedContext: contexts.join('\n\n') }
}
