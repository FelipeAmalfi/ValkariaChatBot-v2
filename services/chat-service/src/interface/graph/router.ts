import type { ValkáriaState } from './state.js'

export function routeAfterSanitize(state: ValkáriaState): string {
  return state.blocked ? '__end__' : 'identifyIntent'
}

export function routeAfterIntent(state: ValkáriaState): string {
  switch (state.intent) {
    case 'ask_character':
      return state.complexity === 'multistep' ? 'planner' : 'simpleRetrieval'
    case 'ask_location':
    case 'ask_lore':
    case 'search_npcs':
    case 'search_locations':
    case 'ask_benefits':
      return 'simpleRetrieval'
    case 'ask_relationship':
    case 'ask_faction':
      return 'cypherGenerate'
    case 'ask_affinity':
      return 'affinityNode'
    case 'ask_memory':
      return 'memoryNode'
    case 'recommend_npcs':
    case 'ask_recommendation':
      return 'recommendationNode'
    case 'feedback_recommendation':
      return 'feedbackNode'
    default:
      return 'narrativeResponse'
  }
}

export function routeAfterCypherExecute(state: ValkáriaState): string {
  if (state.actionError && state.cypherRetryCount <= 1) {
    return 'cypherGenerate'
  }
  return 'narrativeResponse'
}

export function routeAfterPlanner(state: ValkáriaState): string {
  return state.plannerPlan && state.plannerPlan.steps.length > 0
    ? 'retrievalOrchestrator'
    : 'simpleRetrieval'
}
