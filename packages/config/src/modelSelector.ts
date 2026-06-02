export const CANDIDATE_MODELS = [
  'openrouter/owl-alpha',
  'poolside/laguna-xs.2:free',
]

const ERROR_PENALTY_MS = 30_000
const EMA_ALPHA = 0.3
const WARMUP_ROUNDS = 2

export class ModelSelector {
  private ema = new Map<string, number>()
  private calls = new Map<string, number>()

  constructor(private readonly models: string[] = CANDIDATE_MODELS) {}

  pick(): string {
    const total = [...this.calls.values()].reduce((a, b) => a + b, 0)

    if (total < this.models.length * WARMUP_ROUNDS) {
      return this.models[total % this.models.length]!
    }

    let best = this.models[0]!
    let bestLatency = this.ema.get(best) ?? Infinity
    for (const m of this.models) {
      const lat = this.ema.get(m) ?? Infinity
      if (lat < bestLatency) { bestLatency = lat; best = m }
    }
    return best
  }

  record(model: string, latencyMs: number): void {
    this.calls.set(model, (this.calls.get(model) ?? 0) + 1)
    const prev = this.ema.get(model)
    this.ema.set(model, prev === undefined ? latencyMs : EMA_ALPHA * latencyMs + (1 - EMA_ALPHA) * prev)
  }

  recordError(model: string): void {
    this.record(model, ERROR_PENALTY_MS)
  }

  stats(): Record<string, number | undefined> {
    return Object.fromEntries(this.models.map(m => [m, this.ema.get(m)]))
  }
}
