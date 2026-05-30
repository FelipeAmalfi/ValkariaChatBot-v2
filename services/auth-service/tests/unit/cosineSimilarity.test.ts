import { describe, it, expect } from 'vitest'
import { cosineSimilarity } from '../../src/infrastructure/ai/cosineSimilarity.js'

describe('cosineSimilarity', () => {
  it('identical vectors → 1.0', () => {
    const v = [0.1, 0.5, 0.8]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5)
  })

  it('orthogonal vectors → 0.0', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0)
  })

  it('opposite vectors → -1.0', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0)
  })

  it('zero vector → 0 (no division by zero)', () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0)
  })

  it('above threshold 0.6 for similar vectors', () => {
    const a = [0.9, 0.1, 0.05]
    const b = [0.88, 0.12, 0.06]
    expect(cosineSimilarity(a, b)).toBeGreaterThan(0.6)
  })

  it('below threshold 0.6 for unrelated vectors', () => {
    const a = [1, 0, 0, 0]
    const b = [0, 1, 0, 0]
    expect(cosineSimilarity(a, b)).toBeLessThan(0.6)
  })

  it('throws on mismatched vector lengths', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow()
  })
})
