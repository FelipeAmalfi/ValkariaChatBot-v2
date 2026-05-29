import type { ValkáriaState } from '../state.js'

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)\s+instructions/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+if/i,
  /pretend\s+you\s+are/i,
  /\bsystem\s+prompt\b/i,
]

export function sanitizeNode() {
  return async function (state: ValkáriaState): Promise<Partial<ValkáriaState>> {
    const content = state.message
    const cleaned = content
      // strip control characters except tab (\x09) and newline (\x0A, \x0D)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .slice(0, 2000)

    const injectionScore = INJECTION_PATTERNS.filter((p) => p.test(cleaned)).length

    return {
      blocked: injectionScore >= 2,
      message: cleaned,
    }
  }
}
