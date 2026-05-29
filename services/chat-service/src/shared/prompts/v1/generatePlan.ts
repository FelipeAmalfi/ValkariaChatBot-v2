export interface PlannerStep {
  strategy: 'vector' | 'affinity' | 'character_lookup' | 'memory'
  target: string
  filters?: Record<string, string>
  purpose: string
}

export interface PlannerPlan {
  steps: PlannerStep[]
}
