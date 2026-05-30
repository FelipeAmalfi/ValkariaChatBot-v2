import { describe, it, expect } from 'vitest'
import { scoreToLevel } from '../src/value-objects/AffinityLevel.js'

describe('scoreToLevel', () => {
  it.each([
    [0, 'none'],
    [-1, 'none'],
    [-100, 'none'],
    [1, 'cordial'],
    [25, 'cordial'],
    [26, 'loyal'],
    [75, 'loyal'],
    [76, 'intimate'],
    [100, 'intimate'],
    [150, 'intimate'],
  ] as const)('score %i → %s', (score, expected) => {
    expect(scoreToLevel(score)).toBe(expected)
  })
})
