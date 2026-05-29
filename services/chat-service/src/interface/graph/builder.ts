import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { ValkáriaStateAnnotation } from './state.js'
import type { ValkáriaState } from './state.js'
import {
  routeAfterSanitize,
  routeAfterIntent,
  routeAfterCypherExecute,
} from './router.js'
import { sanitizeNode } from './nodes/sanitizeNode.js'
import { identifyIntentNode } from './nodes/identifyIntentNode.js'
import { sessionLoadNode } from './nodes/sessionLoadNode.js'
import { simpleRetrievalNode } from './nodes/simpleRetrievalNode.js'
import { graphRetrievalNode } from './nodes/graphRetrievalNode.js'
import { cypherGenerateNode } from './nodes/cypherGenerateNode.js'
import { cypherExecuteNode } from './nodes/cypherExecuteNode.js'
import type { GraphDependencies } from './dependencies.js'

function withDeps(
  fn: (state: ValkáriaState, deps: GraphDependencies) => Promise<Partial<ValkáriaState>>,
  deps: GraphDependencies,
) {
  return (state: ValkáriaState) => fn(state, deps)
}

export function buildValkáriaGraph(
  deps: GraphDependencies,
  checkpointer?: BaseCheckpointSaver,
) {
  const graph = new StateGraph(ValkáriaStateAnnotation)

  graph
    .addNode('sanitize',         sanitizeNode())
    .addNode('identifyIntent',   identifyIntentNode(deps))
    .addNode('sessionLoad',      sessionLoadNode(deps))
    .addNode('simpleRetrieval',  withDeps(simpleRetrievalNode, deps))
    .addNode('graphRetrieval',   withDeps(graphRetrievalNode, deps))
    .addNode('cypherGenerate',   withDeps(cypherGenerateNode, deps))
    .addNode('cypherExecute',    withDeps(cypherExecuteNode, deps))
    .addNode('planner',          async () => ({}))  // Phase 09 stub
    .addNode('narrativeResponse', async (state) => ({
      response: `[Phase 08 stub] Context: ${state.retrievedContext ?? state.graphContext ?? 'none'}`,
    }))
    .addNode('turnPersistence',  async () => ({}))

    .addEdge(START, 'sanitize')
    .addConditionalEdges('sanitize', routeAfterSanitize, {
      identifyIntent: 'identifyIntent',
      __end__: END,
    })
    .addEdge('identifyIntent', 'sessionLoad')
    .addConditionalEdges('sessionLoad', routeAfterIntent, {
      simpleRetrieval:  'simpleRetrieval',
      graphRetrieval:   'graphRetrieval',
      cypherGenerate:   'cypherGenerate',
      planner:          'planner',
      narrativeResponse: 'narrativeResponse',
    })
    .addEdge('simpleRetrieval', 'narrativeResponse')
    .addEdge('graphRetrieval',  'narrativeResponse')
    .addEdge('planner',         'narrativeResponse')
    .addEdge('cypherGenerate',  'cypherExecute')
    .addConditionalEdges('cypherExecute', routeAfterCypherExecute, {
      cypherGenerate:   'cypherGenerate',
      narrativeResponse: 'narrativeResponse',
    })
    .addEdge('narrativeResponse', 'turnPersistence')
    .addEdge('turnPersistence', END)

  return graph.compile({ checkpointer })
}

export type ValkáriaGraph = ReturnType<typeof buildValkáriaGraph>
