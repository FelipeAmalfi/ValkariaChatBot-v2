import type { RunnableConfig } from '@langchain/core/runnables'
import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'
import type { SessionContext } from '@valkaria/domain'
import type { PlayerRole } from '@valkaria/domain'

export function sessionLoadNode(deps: GraphDependencies) {
  return async function (
    _state: ValkáriaState,
    config?: RunnableConfig,
  ): Promise<Partial<ValkáriaState>> {
    const threadId = config?.configurable?.thread_id as string | undefined

    if (!threadId) {
      return { sessionContext: undefined }
    }

    const existing = await deps.sessionStore.load(threadId)
    if (existing) {
      return {
        sessionContext: existing,
        playerRole: existing.role,
        playerId: existing.playerId,
      }
    }

    const jwtRole = config?.configurable?.jwt_role as PlayerRole | undefined
    const jwtPlayerId = config?.configurable?.jwt_player_id as string | undefined
    const jwtPlayerName = config?.configurable?.jwt_player_name as string | undefined

    if (jwtRole) {
      const sessionContext: SessionContext = {
        threadId,
        role: jwtRole,
        recentContext: [],
        affinityContext: [],
        ...(jwtPlayerId ? { playerId: jwtPlayerId } : {}),
        ...(jwtPlayerName ? { playerName: jwtPlayerName } : {}),
      }
      try { await deps.sessionStore.save(threadId, sessionContext) } catch { /* non-fatal */ }
      return { sessionContext, playerRole: jwtRole, playerId: jwtPlayerId }
    }

    return { sessionContext: undefined }
  }
}
