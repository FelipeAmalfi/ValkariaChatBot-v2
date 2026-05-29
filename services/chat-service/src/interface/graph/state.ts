import { Annotation } from '@langchain/langgraph'
import type { Intent, Slots, Complexity } from '../../shared/prompts/v1/identifyIntent.js'
import type { PlannerPlan } from '../../shared/prompts/v1/generatePlan.js'
import type { PlayerRole, SessionContext, AffinitySnapshot } from '@valkaria/domain'

export const ValkáriaStateAnnotation = Annotation.Root({
  message: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),

  blocked: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),

  intent:            Annotation<Intent | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  slots:             Annotation<Partial<Slots>>({ reducer: (p, n) => ({ ...p, ...n }), default: () => ({}) }),
  complexity:        Annotation<Complexity | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  confidence:        Annotation<number | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  requiresRetrieval: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),

  sessionContext: Annotation<SessionContext | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  playerRole:     Annotation<PlayerRole | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  playerId:       Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),

  retrievalResults:  Annotation<unknown[]>({ reducer: (_, n) => n, default: () => [] }),
  plannerPlan:       Annotation<PlannerPlan | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  aggregatedContext: Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),

  retrievedContext:  Annotation<string | null>({ reducer: (_, n) => n, default: () => null }),
  graphContext:      Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  cypherQueries:     Annotation<string[]>({ reducer: (_, n) => n, default: () => [] }),
  cypherResults:     Annotation<unknown[]>({ reducer: (_, n) => n, default: () => [] }),

  lastCypherQueries: Annotation<Array<{ cypher: string; purpose: string }> | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  lastCypherError:   Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  cypherRetryCount:  Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),

  affinitySnapshot:    Annotation<AffinitySnapshot[]>({ reducer: (_, n) => n, default: () => [] }),
  recommendationContext: Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),

  response:            Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  retrievalError:      Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  lastRecommendedNpcs: Annotation<string[]>({ reducer: (_, n) => n, default: () => [] }),

  actionSuccess: Annotation<boolean | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  actionError:   Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  actionData:    Annotation<unknown>({ reducer: (_, n) => n, default: () => undefined }),
})

export type ValkáriaState = typeof ValkáriaStateAnnotation.State
