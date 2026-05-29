import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { ValkáriaStateAnnotation } from './state.js'
import { routeAfterSanitize } from './router.js'
import { sanitizeNode } from './nodes/sanitizeNode.js'
import { identifyIntentNode } from './nodes/identifyIntentNode.js'
import { sessionLoadNode } from './nodes/sessionLoadNode.js'
import type { GraphDependencies } from './dependencies.js'

export function buildValkáriaGraph(
  deps: GraphDependencies,
  checkpointer?: BaseCheckpointSaver,
) {
  const graph = new StateGraph(ValkáriaStateAnnotation)

  graph
    .addNode('sanitize',       sanitizeNode())
    .addNode('identifyIntent', identifyIntentNode(deps))
    .addNode('sessionLoad',    sessionLoadNode(deps))
    .addNode('narrativeResponse', async (state) => ({
      response: `[Phase 07 stub] Intent: ${state.intent ?? 'unknown'}, Message received.`,
    }))
    .addNode('turnPersistence', async () => ({}))

    .addEdge(START, 'sanitize')
    .addConditionalEdges('sanitize', routeAfterSanitize, {
      identifyIntent: 'identifyIntent',
      __end__: END,
    })
    .addEdge('identifyIntent', 'sessionLoad')
    .addConditionalEdges('sessionLoad', () => 'narrativeResponse', {
      narrativeResponse: 'narrativeResponse',
    })
    .addEdge('narrativeResponse', 'turnPersistence')
    .addEdge('turnPersistence', END)

  return graph.compile({ checkpointer })
}

export type ValkáriaGraph = ReturnType<typeof buildValkáriaGraph>
