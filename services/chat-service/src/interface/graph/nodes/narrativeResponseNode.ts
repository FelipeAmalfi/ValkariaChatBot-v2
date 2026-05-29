import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

async function buildSystemPrompt(state: ValkáriaState, deps: GraphDependencies): Promise<string> {
  const role = state.sessionContext?.role ?? null
  const threadId = state.sessionContext?.threadId

  let memorySummary: string | null = null
  if (threadId) {
    try {
      memorySummary = await deps.memoryEngine.getSummary(threadId)
    } catch { /* non-fatal */ }
  }

  const recentContext = state.sessionContext?.recentContext.slice(-3).join('\n') ?? ''

  const roleInstruction = role === 'DM'
    ? 'O usuário é o Mestre do Jogo (DM). Forneça informações completas e detalhadas, incluindo dados de bastidores, pontuações de afinidade e informações confidenciais dos NPCs.'
    : role === 'PLAYER'
    ? 'O usuário é um jogador. Forneça apenas informações que o personagem conheceria dentro do mundo do jogo. Sem informações meta-game.'
    : 'O usuário ainda não está autenticado. Apresente o mundo e encoraje o registro.'

  return `Você é o narrador de Candessah, uma cidade de repouso em Valkária — um mundo de fantasia rico em lore.
Responda SEMPRE em português brasileiro.
Mantenha um tom narrativo de RPG, evocativo e imersivo.

${roleInstruction}

${memorySummary ? `Contexto da memória: ${memorySummary.slice(0, 300)}` : ''}
${recentContext ? `Contexto recente:\n${recentContext}` : ''}`
}

function buildUserPrompt(state: ValkáriaState): string {
  const parts: string[] = []

  parts.push(`Mensagem do usuário: ${state.message}`)

  if (state.retrievedContext) {
    parts.push(`\nInformações relevantes encontradas:\n${state.retrievedContext}`)
  }
  if (state.graphContext) {
    parts.push(`\nDados do grafo de relacionamentos:\n${state.graphContext}`)
  }
  if (state.affinitySnapshot.length > 0) {
    const affinities = state.affinitySnapshot
      .map(a => `${a.npcName}: ${a.level} (${a.score})`)
      .join(', ')
    parts.push(`\nAfinidades do jogador: ${affinities}`)
  }
  if (state.recommendationContext) {
    parts.push(`\nNPCs recomendados:\n${state.recommendationContext}`)
    parts.push('\nApresente estes NPCs de forma narrativa e imersiva. Mencione cada um com um breve motivo pelo qual seriam interessantes.')
  }

  return parts.join('\n')
}

export async function narrativeResponseNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const systemPrompt = await buildSystemPrompt(state, deps)
  const userPrompt = buildUserPrompt(state)

  const { content } = await deps.aiProvider.complete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 'chat', 0.7, 1024)

  return { response: content }
}
