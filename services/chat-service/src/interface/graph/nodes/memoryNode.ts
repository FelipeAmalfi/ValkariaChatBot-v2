import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

export async function memoryNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const threadId = state.sessionContext?.threadId
  if (!threadId) return { response: 'Não tenho memória desta sessão.' }

  const summary = await deps.memoryEngine.getSummary(threadId)
  const recentContext = state.sessionContext?.recentContext.slice(-3) ?? []

  const memoryResponse = summary
    ? `Memória da sessão: ${summary.slice(0, 300)}\n\nÚltimas mensagens: ${recentContext.join(' | ')}`
    : 'Ainda não há memória acumulada nesta sessão.'

  return { response: memoryResponse }
}
