export type AffinityLevel = 'none' | 'cordial' | 'loyal' | 'intimate'

export function scoreToLevel(score: number): AffinityLevel {
  if (score <= 0)  return 'none'
  if (score <= 25) return 'cordial'
  if (score <= 75) return 'loyal'
  return 'intimate'
}
