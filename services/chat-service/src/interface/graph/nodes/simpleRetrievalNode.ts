import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { Character } from '@valkaria/domain'
import type { Location } from '@valkaria/domain'

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

function formatLocation(location: Location): string {
  const lines: string[] = [`${location.name} é um local em Valkária.`]
  if (location.description) lines.push(location.description)
  if (location.services?.length) {
    lines.push(`Serviços: ${location.services.join(', ')}.`)
  }
  return lines.join('\n')
}

function formatBenefits(character: Character): string {
  const m = character.metadata
  const parts = [
    m.benefits_cordial ? `Cordial: ${m.benefits_cordial}` : null,
    m.benefits_loyal ? `Leal: ${m.benefits_loyal}` : null,
    m.benefits_intimate ? `Íntimo: ${m.benefits_intimate}` : null,
  ].filter((p): p is string => p !== null)
  if (!parts.length) return `${character.name} não possui benefícios registrados.`
  return `Benefícios de ${character.name}:\n${parts.join('\n')}`
}

export async function simpleRetrievalNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  try {
    let retrievedContext: string | null = null
    const { intent, slots } = state

    if (intent === 'ask_character' && slots.characterName) {
      const character = await deps.characterRepository.findByName(String(slots.characterName))
      if (character) {
        retrievedContext = formatCharacter(character)
      } else {
        const embedding = await deps.aiProvider.embed(String(slots.characterName))
        const docs = await deps.vectorRetriever.search(embedding, { type: 'npc' }, 3)
        retrievedContext = docs.map(d => d.document).join('\n\n')
      }
    } else if (intent === 'ask_location' && slots.locationName) {
      const location = await deps.locationRepository.findByName(String(slots.locationName))
      if (location) {
        retrievedContext = formatLocation(location)
      } else {
        const embedding = await deps.aiProvider.embed(String(slots.locationName))
        const docs = await deps.vectorRetriever.search(embedding, { type: 'location' }, 3)
        retrievedContext = docs.map(d => d.document).join('\n\n')
      }
    } else if (
      intent === 'ask_lore' ||
      intent === 'search_npcs' ||
      intent === 'search_locations'
    ) {
      const query = slots.topic ?? state.message
      const docs = await deps.loreQueryService.search(query, 5)
      retrievedContext = docs.map(d => d.document).join('\n\n')
    } else if (intent === 'ask_benefits' && slots.characterName) {
      const character = await deps.characterRepository.findByName(String(slots.characterName))
      if (character) {
        retrievedContext = formatBenefits(character)
      }
    }

    return { retrievedContext }
  } catch {
    return { retrievedContext: null }
  }
}
