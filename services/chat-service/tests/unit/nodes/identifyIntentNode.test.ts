import { describe, it, expect, vi } from 'vitest'
import { identifyIntentNode } from '../../../src/interface/graph/nodes/identifyIntentNode.js'
import type { GraphDependencies } from '../../../src/interface/graph/dependencies.js'

const baseState = {
  message: 'Olá!',
  blocked: false,
  intent: undefined,
  slots: {},
  complexity: undefined,
  confidence: undefined,
  requiresRetrieval: false,
  sessionContext: undefined,
  playerRole: undefined,
  playerId: undefined,
  retrievalResults: [],
  plannerPlan: undefined,
  aggregatedContext: undefined,
  lastCypherQueries: undefined,
  lastCypherError: undefined,
  cypherRetryCount: 0,
  response: undefined,
  retrievalError: undefined,
  lastRecommendedNpcs: [],
  actionSuccess: undefined,
  actionError: undefined,
  actionData: undefined,
}

function makeDeps(responseContent: string): GraphDependencies {
  return {
    aiProvider: {
      complete: vi.fn().mockResolvedValue({ content: responseContent }),
      embed: vi.fn(),
    },
  } as unknown as GraphDependencies
}

describe('identifyIntentNode', () => {
  it('parses a valid classification response', async () => {
    const json = JSON.stringify({
      intent: 'greeting',
      slots: {},
      confidence: 0.95,
      complexity: 'simple',
      requiresRetrieval: false,
    })
    const deps = makeDeps(json)
    const run = identifyIntentNode(deps)
    const result = await run(baseState)

    expect(result.intent).toBe('greeting')
    expect(result.confidence).toBe(0.95)
    expect(result.complexity).toBe('simple')
    expect(result.requiresRetrieval).toBe(false)
  })

  it('strips markdown code fences before parsing', async () => {
    const json = '```json\n{"intent":"chat","slots":{},"confidence":0.8,"complexity":"simple","requiresRetrieval":false}\n```'
    const deps = makeDeps(json)
    const run = identifyIntentNode(deps)
    const result = await run(baseState)

    expect(result.intent).toBe('chat')
  })

  it('returns unknown intent on parse failure', async () => {
    const deps = makeDeps('not valid json')
    const run = identifyIntentNode(deps)
    const result = await run(baseState)

    expect(result.intent).toBe('unknown')
    expect(result.confidence).toBe(0)
  })

  it('resets action fields each turn', async () => {
    const json = JSON.stringify({
      intent: 'greeting',
      slots: {},
      confidence: 0.9,
      complexity: 'simple',
      requiresRetrieval: false,
    })
    const deps = makeDeps(json)
    const run = identifyIntentNode(deps)
    const result = await run({ ...baseState, actionError: 'previous error' })

    expect(result.actionError).toBeUndefined()
    expect(result.actionData).toBeUndefined()
  })
})
