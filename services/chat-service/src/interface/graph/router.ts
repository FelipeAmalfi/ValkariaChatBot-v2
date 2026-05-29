import type { ValkáriaState } from './state.js'

export function routeAfterSanitize(state: ValkáriaState): string {
  return state.blocked ? '__end__' : 'identifyIntent'
}
