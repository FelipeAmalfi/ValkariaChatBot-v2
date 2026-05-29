import { END, START, StateGraph } from '@langchain/langgraph'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import { ValkáriaStateAnnotation } from './state.js'
import type { ValkáriaState } from './state.js'
import {
  routeAfterSanitize,
  routeAfterIntent,
  routeAfterCypherExecute,
  routeAfterPlanner,
} from './router.js'
import { sanitizeNode } from './nodes/sanitizeNode.js'
import { identifyIntentNode } from './nodes/identifyIntentNode.js'
import { sessionLoadNode } from './nodes/sessionLoadNode.js'
import { identityFlowNode } from './nodes/identityFlowNode.js'
import { simpleRetrievalNode } from './nodes/simpleRetrievalNode.js'
import { graphRetrievalNode } from './nodes/graphRetrievalNode.js'
import { cypherGenerateNode } from './nodes/cypherGenerateNode.js'
import { cypherExecuteNode } from './nodes/cypherExecuteNode.js'
import { plannerNode } from './nodes/plannerNode.js'
import { retrievalOrchestratorNode } from './nodes/retrievalOrchestratorNode.js'
import { affinityNode } from './nodes/affinityNode.js'
import { recommendationNode } from './nodes/recommendationNode.js'
import { feedbackNode } from './nodes/feedbackNode.js'
import { memoryNode } from './nodes/memoryNode.js'
import { narrativeResponseNode } from './nodes/narrativeResponseNode.js'
import { turnPersistenceNode } from './nodes/turnPersistenceNode.js'
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
    .addNode('sanitize',               sanitizeNode())
    .addNode('identifyIntent',         identifyIntentNode(deps))
    .addNode('sessionLoad',            sessionLoadNode(deps))
    .addNode('identityFlow',           withDeps(identityFlowNode, deps))
    .addNode('simpleRetrieval',        withDeps(simpleRetrievalNode, deps))
    .addNode('graphRetrieval',         withDeps(graphRetrievalNode, deps))
    .addNode('cypherGenerate',         withDeps(cypherGenerateNode, deps))
    .addNode('cypherExecute',          withDeps(cypherExecuteNode, deps))
    .addNode('planner',                withDeps(plannerNode, deps))
    .addNode('retrievalOrchestrator',  withDeps(retrievalOrchestratorNode, deps))
    .addNode('affinityNode',           withDeps(affinityNode, deps))
    .addNode('recommendationNode',     withDeps(recommendationNode, deps))
    .addNode('feedbackNode',           withDeps(feedbackNode, deps))
    .addNode('memoryNode',             withDeps(memoryNode, deps))
    .addNode('narrativeResponse',      withDeps(narrativeResponseNode, deps))
    .addNode('turnPersistence',        withDeps(turnPersistenceNode, deps))

    .addEdge(START, 'sanitize')
    .addConditionalEdges('sanitize', routeAfterSanitize, {
      identifyIntent: 'identifyIntent',
      __end__: END,
    })
    .addEdge('identifyIntent', 'sessionLoad')
    .addConditionalEdges('sessionLoad', routeAfterIntent, {
      identityFlow:       'identityFlow',
      simpleRetrieval:    'simpleRetrieval',
      graphRetrieval:     'graphRetrieval',
      cypherGenerate:     'cypherGenerate',
      planner:            'planner',
      affinityNode:       'affinityNode',
      recommendationNode: 'recommendationNode',
      feedbackNode:       'feedbackNode',
      memoryNode:         'memoryNode',
      narrativeResponse:  'narrativeResponse',
    })
    .addEdge('identityFlow',           'narrativeResponse')
    .addEdge('simpleRetrieval',        'narrativeResponse')
    .addEdge('graphRetrieval',         'narrativeResponse')
    .addEdge('cypherGenerate',         'cypherExecute')
    .addConditionalEdges('cypherExecute', routeAfterCypherExecute, {
      cypherGenerate:    'cypherGenerate',
      narrativeResponse: 'narrativeResponse',
    })
    .addConditionalEdges('planner', routeAfterPlanner, {
      retrievalOrchestrator: 'retrievalOrchestrator',
      simpleRetrieval:       'simpleRetrieval',
    })
    .addEdge('retrievalOrchestrator',  'narrativeResponse')
    .addEdge('affinityNode',           'narrativeResponse')
    .addEdge('recommendationNode',     'narrativeResponse')
    .addEdge('feedbackNode',           'turnPersistence')
    .addEdge('memoryNode',             'turnPersistence')
    .addEdge('narrativeResponse',      'turnPersistence')
    .addEdge('turnPersistence',        END)

  return graph.compile({ checkpointer })
}

export type ValkáriaGraph = ReturnType<typeof buildValkáriaGraph>
