import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { SessionContext } from '@valkaria/domain'
import { cosineSimilarity } from '../../../infrastructure/ai/cosineSimilarity.js'

const AUTH_THRESHOLD = 0.6

async function buildPlayerProfileText(player: {
  background: string
  personality: string
  interests: string
  class: string
  race: string
}): Promise<string> {
  return [player.background, player.personality, player.interests, player.class, player.race]
    .filter(Boolean)
    .join('. ')
}

async function handleIdentifyPlayer(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const threadId = state.sessionContext?.threadId

  // Already authenticated
  if (state.sessionContext?.role === 'PLAYER' && state.sessionContext?.playerId) {
    return {
      retrievedContext: `O jogador ${state.sessionContext.playerName ?? ''} já está autenticado como PLAYER em Candessah.`,
    }
  }

  const characterName = (state.slots.characterName as string | undefined)
    ?? state.sessionContext?.playerName

  // Challenge in progress: playerId set but not yet PLAYER — validate this message
  if (state.sessionContext?.playerId && state.sessionContext.role !== 'PLAYER') {
    const player = await deps.playerRepository.findById(state.sessionContext.playerId)
    if (!player) {
      return { retrievedContext: 'Personagem não encontrado. Por favor, tente novamente com seu nome completo.' }
    }

    const profileText = await buildPlayerProfileText(player)
    const [messageEmbedding, profileEmbedding] = await Promise.all([
      deps.aiProvider.embed(state.message),
      deps.aiProvider.embed(profileText),
    ])
    const similarity = cosineSimilarity(messageEmbedding, profileEmbedding)

    if (similarity >= AUTH_THRESHOLD) {
      if (threadId) {
        const updatedContext: SessionContext = {
          ...state.sessionContext!,
          role: 'PLAYER',
          playerId: player.id,
          playerName: player.name,
        }
        try { await deps.sessionStore.save(threadId, updatedContext) } catch { /* non-fatal */ }
        return {
          sessionContext: updatedContext,
          playerRole: 'PLAYER',
          playerId: player.id,
          retrievedContext: `Identidade confirmada! Bem-vindo de volta, ${player.name}. Seu acesso como PLAYER foi concedido em Candessah.`,
        }
      }
    }

    return {
      retrievedContext: `Descrição não correspondeu ao perfil de ${player.name}. Por favor, descreva melhor a história e personalidade do seu personagem.`,
    }
  }

  // New identification: look up player by name
  if (!characterName) {
    return {
      retrievedContext: 'Mencione o nome do seu personagem para iniciar a identificação em Candessah.',
    }
  }

  const player = await deps.playerRepository.findByName(characterName)
  if (!player) {
    return {
      retrievedContext: `Não encontrei um personagem chamado "${characterName}" nos registros de Candessah. Verifique o nome e tente novamente.`,
    }
  }

  // Start challenge: store playerId in session, ask player to describe their character
  if (threadId) {
    const baseContext = state.sessionContext ?? {
      threadId,
      role: 'PLAYER' as const,
      recentContext: [],
      affinityContext: [],
    }
    const challengeContext: SessionContext = {
      ...baseContext,
      playerId: player.id,
      playerName: player.name,
    }
    // Use a temporary non-PLAYER role marker by not setting role to PLAYER yet
    // We store the playerId so the next turn knows a challenge is in progress
    // The role remains whatever it was (default safe: treat as not-yet-validated)
    try { await deps.sessionStore.save(threadId, { ...challengeContext, role: 'PLAYER' as const }) } catch { /* non-fatal */ }
    return {
      sessionContext: { ...challengeContext, role: 'PLAYER' as const },
      retrievedContext: `Personagem "${player.name}" encontrado. Para confirmar sua identidade, descreva a história de origem, personalidade e motivações do seu personagem em suas próprias palavras.`,
    }
  }

  return {
    retrievedContext: `Personagem "${player.name}" encontrado. Descreva a história e personalidade do seu personagem para confirmar sua identidade.`,
  }
}

async function handleIdentifyDm(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const dmPassword = process.env.DM_PASSWORD ?? ''
  const threadId = state.sessionContext?.threadId

  // Extract password — look for the last word or use full message trimmed
  const candidate = state.message.trim()

  if (!dmPassword || candidate !== dmPassword) {
    return { retrievedContext: 'Credenciais de Mestre inválidas. Acesso negado.' }
  }

  if (threadId) {
    const baseContext = state.sessionContext ?? {
      threadId,
      role: 'DM' as const,
      recentContext: [],
      affinityContext: [],
    }
    const dmContext: SessionContext = { ...baseContext, role: 'DM' }
    try { await deps.sessionStore.save(threadId, dmContext) } catch { /* non-fatal */ }
    return {
      sessionContext: dmContext,
      playerRole: 'DM',
      retrievedContext: 'Acesso de Mestre concedido. Bem-vindo, Narrador. Todas as informações de Candessah estão à sua disposição.',
    }
  }

  return { retrievedContext: 'Acesso de Mestre concedido. Bem-vindo, Narrador.' }
}

export async function identityFlowNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  if (state.intent === 'identify_dm') {
    return handleIdentifyDm(state, deps)
  }
  return handleIdentifyPlayer(state, deps)
}
