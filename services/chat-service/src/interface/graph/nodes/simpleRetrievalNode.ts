import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { Character, AffinityEntry } from '@valkaria/domain'
import type { Location } from '@valkaria/domain'

function formatCharacter(character: Character): string {
  const lines: string[] = [`${character.name} é um(a) ${character.role}.`]
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

const LEVEL_ORDER = ['none', 'cordial', 'loyal', 'intimate'] as const
type AffinityLevel = typeof LEVEL_ORDER[number]

function levelUnlocks(current: AffinityLevel, required: AffinityLevel): boolean {
  return LEVEL_ORDER.indexOf(current) >= LEVEL_ORDER.indexOf(required)
}

function formatBenefits(character: Character, affinity: AffinityEntry | null): string {
  const m = character.metadata
  const currentLevel = (affinity?.level ?? 'none') as AffinityLevel
  const score = affinity?.score ?? 0
  const interactionCount = affinity?.interactionCount ?? 0

  const levelLabel: Record<AffinityLevel, string> = {
    none: 'Neutro',
    cordial: 'Cordial',
    loyal: 'Leal',
    intimate: 'Íntimo',
  }

  const benefitLines = [
    { key: 'cordial' as AffinityLevel, label: 'Cordial', text: m.benefits_cordial },
    { key: 'loyal' as AffinityLevel, label: 'Leal', text: m.benefits_loyal },
    { key: 'intimate' as AffinityLevel, label: 'Íntimo', text: m.benefits_intimate },
  ]
    .filter(b => b.text)
    .map(b => {
      const unlocked = levelUnlocks(currentLevel, b.key)
      const status = unlocked ? '[DESBLOQUEADO]' : '[BLOQUEADO]'
      return `${b.label} ${status}: ${b.text}`
    })

  if (!benefitLines.length) return `${character.name} não possui benefícios registrados.`

  return [
    `Benefícios de ${character.name}:`,
    `Afinidade atual do jogador: ${levelLabel[currentLevel]} (pontos: ${score.toFixed(0)}, interações: ${interactionCount})`,
    '',
    ...benefitLines,
  ].join('\n')
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
        const playerId = state.sessionContext?.playerId ?? null
        const affinity = playerId
          ? await deps.affinityRepository.findByPlayerAndNpc(playerId, character.name).catch(() => null)
          : null
        retrievedContext = formatBenefits(character, affinity)
      }
    }

    return { retrievedContext }
  } catch {
    return { retrievedContext: null }
  }
}
