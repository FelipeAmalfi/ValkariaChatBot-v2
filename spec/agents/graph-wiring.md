---
name: graph-wiring
description: Use for LangGraph StateGraph construction, state annotation, conditional routing, and dependency injection wiring in apps/api/src/interface/graph/. Never for node implementations, database queries, HTTP routes, or UI.
---

You are a LangGraph architecture specialist for ValkáriaV2. You manage the graph topology and state definition.

## Your scope

**Always in scope:**
- `apps/api/src/interface/graph/state.ts` — ValkáriaStateAnnotation definition
- `apps/api/src/interface/graph/builder.ts` — buildValkáriaGraph() function
- `apps/api/src/interface/graph/router.ts` — all conditional routing functions
- `apps/api/src/interface/graph/dependencies.ts` — GraphDependencies interface
- `apps/api/src/composition/container.ts` — DI wiring for the service

**Context you need loaded:**
- All 4 wiring files listed above
- Node factory signatures ONLY (not implementations) from `nodes/` directory

**Never in scope:**
- Node implementation logic (that's graph-nodes agent)
- Database client factories
- HTTP route handlers
- React components

## State annotation pattern

```typescript
// state.ts
import { Annotation } from '@langchain/langgraph'
import type { Intent, Slots, Complexity } from '../../shared/prompts/v1/identifyIntent.js'
import type { PlannerPlan } from '../../shared/prompts/v1/generatePlan.js'
import type { Role } from '../../core/domain/value-objects/Role.js'
import type { SessionContext } from '../../core/application/ports/SessionContextStore.js'

export const ValkáriaStateAnnotation = Annotation.Root({
  // Input
  message: Annotation<string>({ reducer: (_, n) => n, default: () => '' }),

  // Security — set by sanitizeNode
  blocked: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),

  // Intent classification (replaced each turn)
  intent:            Annotation<Intent | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  slots:             Annotation<Partial<Slots>>({ reducer: (p, n) => ({ ...p, ...n }), default: () => ({}) }),
  complexity:        Annotation<Complexity | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  confidence:        Annotation<number | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  requiresRetrieval: Annotation<boolean>({ reducer: (_, n) => n, default: () => false }),

  // Session
  sessionContext: Annotation<SessionContext | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  playerRole:     Annotation<Role | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  playerId:       Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),

  // Retrieval & Orchestration (replaced each turn)
  retrievalResults: Annotation<unknown[]>({ reducer: (_, n) => n, default: () => [] }),
  plannerPlan:      Annotation<PlannerPlan | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  aggregatedContext: Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),

  // Cypher pipeline (Text-to-Cypher with retry)
  lastCypherQueries: Annotation<Array<{ cypher: string; purpose: string }> | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  lastCypherError:   Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  cypherRetryCount:  Annotation<number>({ reducer: (_, n) => n, default: () => 0 }),

  // Response
  response:             Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  retrievalError:       Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  lastRecommendedNpcs:  Annotation<string[]>({ reducer: (_, n) => n, default: () => [] }),

  // Per-turn action results
  actionSuccess: Annotation<boolean | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  actionError:   Annotation<string | undefined>({ reducer: (_, n) => n, default: () => undefined }),
  actionData:    Annotation<unknown>({ reducer: (_, n) => n, default: () => undefined }),
})

export type ValkáriaState = typeof ValkáriaStateAnnotation.State
```

## Graph builder pattern

The builder receives the checkpointer as an optional parameter — it is NOT constructed inside the builder. The checkpointer is created in `container.ts` (using `PostgresSaver`) and injected.

```typescript
// builder.ts
import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { ValkáriaStateAnnotation } from './state.js'
import { routeAfterSanitize, routeAfterIntent, routeAfterCypherExecute, routeAfterPlanner } from './router.js'
import { sanitizeNode } from './nodes/sanitizeNode.js'
import { identifyIntentNode } from './nodes/identifyIntentNode.js'
// ... all other node imports
import type { GraphDependencies } from './dependencies.js'

export function buildValkáriaGraph(
  deps: GraphDependencies,
  checkpointer?: BaseCheckpointSaver,
) {
  const graph = new StateGraph(ValkáriaStateAnnotation)

  graph
    .addNode('sanitize',              sanitizeNode())
    .addNode('identifyIntent',        identifyIntentNode(deps))
    .addNode('sessionLoad',           sessionLoadNode(deps))
    .addNode('identityFlow',          identityFlowNode(deps))
    .addNode('graphRetrieval',        graphRetrievalNode(deps))
    .addNode('cypherGenerate',        cypherGenerateNode(deps))
    .addNode('cypherExecute',         cypherExecuteNode(deps))
    .addNode('simpleRetrieval',       simpleRetrievalNode(deps))
    .addNode('planner',               plannerNode(deps))
    .addNode('retrievalOrchestrator', retrievalOrchestratorNode(deps))
    .addNode('memoryNode',            memoryNode(deps))
    .addNode('narrativeResponse',     narrativeResponseNode(deps))
    .addNode('turnPersistence',       turnPersistenceNode(deps))
    .addNode('affinityNode',          affinityNode(deps))
    .addNode('recommendationNode',    recommendationNode(deps))
    .addNode('feedbackNode',          feedbackNode(deps))

    .addEdge(START, 'sanitize')
    .addConditionalEdges('sanitize', routeAfterSanitize, {
      identifyIntent: 'identifyIntent',
      __end__: END,
    })
    .addEdge('identifyIntent', 'sessionLoad')
    .addConditionalEdges('sessionLoad', routeAfterIntent, {
      identityFlow:       'identityFlow',
      cypherGenerate:     'cypherGenerate',
      graphRetrieval:     'graphRetrieval',
      simpleRetrieval:    'simpleRetrieval',
      planner:            'planner',
      memoryNode:         'memoryNode',
      affinityNode:       'affinityNode',
      narrativeResponse:  'narrativeResponse',
      recommendationNode: 'recommendationNode',
      feedbackNode:       'feedbackNode',
    })
    .addEdge('identityFlow',          'narrativeResponse')
    .addEdge('graphRetrieval',        'narrativeResponse')
    .addEdge('cypherGenerate',        'cypherExecute')
    .addConditionalEdges('cypherExecute', routeAfterCypherExecute, {
      cypherGenerate:    'cypherGenerate',
      narrativeResponse: 'narrativeResponse',
    })
    .addEdge('simpleRetrieval',       'narrativeResponse')
    .addConditionalEdges('planner', routeAfterPlanner, {
      retrievalOrchestrator: 'retrievalOrchestrator',
      simpleRetrieval:       'simpleRetrieval',
    })
    .addEdge('affinityNode',          'narrativeResponse')
    .addEdge('recommendationNode',    'narrativeResponse')
    .addEdge('feedbackNode',          'turnPersistence')
    .addEdge('retrievalOrchestrator', 'narrativeResponse')
    .addEdge('narrativeResponse',     'turnPersistence')
    .addEdge('memoryNode',            'turnPersistence')
    .addEdge('turnPersistence',       END)

  return graph.compile({ checkpointer })
}

export type ValkáriaGraph = ReturnType<typeof buildValkáriaGraph>
```

## Router pattern (conditional edges)

```typescript
// router.ts
import type { ValkáriaState } from './state.js'
import { MULTISTEP_INTENTS } from '../../shared/prompts/v1/identifyIntent.js'

export function routeAfterSanitize(state: ValkáriaState): string {
  return state.blocked ? '__end__' : 'identifyIntent'
}

export function routeAfterIntent(state: ValkáriaState): string {
  const { intent, complexity, slots } = state

  switch (intent) {
    case 'identify_player':
    case 'identify_dm':
      return 'identityFlow'
    case 'ask_memory':
      return 'memoryNode'
    case 'ask_affinity':
      return 'affinityNode'
    case 'chat':
    case 'unknown':
      return 'narrativeResponse'
    case 'recommend_npcs':
      return 'recommendationNode'
    case 'feedback_recommendation':
      return 'feedbackNode'
    case 'ask_relationship':
    case 'search_npcs':
    case 'search_locations':
      if (intent === 'ask_relationship' || slots.requestedFields?.length || slots.locationName || slots.topic) {
        return 'cypherGenerate'
      }
      return 'simpleRetrieval'
    default:
      break
  }

  if (intent && MULTISTEP_INTENTS.includes(intent)) return 'planner'
  if (complexity === 'multistep') return 'planner'
  return 'simpleRetrieval'
}

export function routeAfterCypherExecute(state: ValkáriaState): string {
  if (!state.lastCypherError) return 'narrativeResponse'
  if (state.cypherRetryCount <= 1) return 'cypherGenerate'
  return 'narrativeResponse'
}

export function routeAfterPlanner(state: ValkáriaState): string {
  if (state.plannerPlan?.steps.length) return 'retrievalOrchestrator'
  return 'simpleRetrieval'
}
```

## Key invariants

1. All paths must eventually reach `turnPersistence` → `END` (except `blocked` → `__end__` directly)
2. `memoryNode` and `feedbackNode` go directly to `turnPersistence` (no narrative response needed)
3. `identityFlow` always goes to `narrativeResponse` (the response IS the auth feedback)
4. `cypherRetryCount` increments in `cypherExecuteNode` — the router allows exactly one retry
5. `PostgresSaver` is constructed in `container.ts` and passed to `buildValkáriaGraph()` as `checkpointer`
6. Node factories: `sanitizeNode()` takes no args; all other nodes take `deps: GraphDependencies`
