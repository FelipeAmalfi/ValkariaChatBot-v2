# Phase 09 — Chat Service Advanced

**Agent**: `graph-nodes`  
**Depends on**: Phase 08  
**Service**: `services/chat-service/`

---

## What you're building

The advanced nodes: multi-step planning, affinity tracking, NPC recommendation, feedback recording, and memory retrieval. After this phase, the graph handles complex queries and maintains relationship context.

---

## Nodes to implement (one at a time)

### Node 5: `plannerNode`

**File**: `src/interface/graph/nodes/plannerNode.ts`  
**Reads**: `state.intent`, `state.slots`, `state.complexity`, `state.messages`  
**Writes**: `state.plan`

Calls LLM to generate a multi-step retrieval plan when `complexity === 'multistep'`.

```typescript
import { getSystemPrompt, getUserPromptTemplate } from '../../shared/prompts/v1/generatePlan'

export async function plannerNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const lastMessage = state.messages[state.messages.length - 1]
  const { content } = await deps.aiProvider.complete([
    { role: 'system', content: getSystemPrompt() },
    { role: 'user', content: getUserPromptTemplate(
      state.intent!,
      state.slots,
      String(lastMessage.content)
    )}
  ], 'plan', 0.2, 512)
  
  const plan = parsePlanResponse(content)
  return { plan: plan.steps.slice(0, 4) }
}
```

### Prompt: `src/shared/prompts/v1/generatePlan.ts`

System prompt specifies:
- 4 retrieval strategies: `vector` (semantic search), `affinity` (player relationship data), `character_lookup` (direct DB lookup), `memory` (session memory)
- Max 4 steps
- No duplicate strategies
- Output format:
  ```json
  {
    "steps": [
      { "strategy": "character_lookup", "target": "Aaliyah", "purpose": "Get NPC description" },
      { "strategy": "affinity", "target": "Aaliyah", "purpose": "Get relationship level" }
    ]
  }
  ```

### Node 6: `retrievalOrchestratorNode`

**File**: `src/interface/graph/nodes/retrievalOrchestratorNode.ts`  
**Reads**: `state.plan`  
**Writes**: `state.retrievedContext`, `state.graphContext`, `state.affinitySnapshot`

Executes each plan step in order and aggregates results:

```typescript
export async function retrievalOrchestratorNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const contexts: string[] = []
  
  for (const step of state.plan ?? []) {
    switch (step.strategy) {
      case 'character_lookup': {
        const char = await deps.characterRepository.findByName(step.target)
        if (char) contexts.push(formatCharacter(char))
        break
      }
      case 'vector': {
        const embedding = await deps.aiProvider.embed(step.target)
        const docs = await deps.vectorRetriever.search(embedding, step.filters, 3)
        contexts.push(docs.map(d => d.document).join('\n'))
        break
      }
      case 'affinity': {
        const entry = await deps.affinityRepository.findByPlayerAndNpc(
          state.sessionContext?.playerId!,
          step.target
        )
        if (entry) contexts.push(`Afinidade com ${step.target}: ${entry.level} (${entry.score})`)
        break
      }
      case 'memory': {
        const summary = await deps.memoryEngine.getSummary(state.sessionContext?.threadId!)
        if (summary) contexts.push(`Memória da sessão: ${summary}`)
        break
      }
    }
  }
  
  return { retrievedContext: contexts.join('\n\n') }
}
```

### Node 7: `affinityNode`

**File**: `src/interface/graph/nodes/affinityNode.ts`  
**Reads**: `state.sessionContext`, `state.slots`  
**Writes**: `state.affinitySnapshot`

Loads affinity entries for the current player. If `slots.affinityTarget` is set, load just that one. Otherwise load all affinities for the player.

```typescript
export async function affinityNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const playerId = state.sessionContext?.playerId
  if (!playerId) return { affinitySnapshot: [] }
  
  const target = state.slots.affinityTarget as string | undefined
  
  let entries: AffinityEntry[]
  if (target) {
    const entry = await deps.affinityRepository.findByPlayerAndNpc(playerId, target)
    entries = entry ? [entry] : []
  } else {
    entries = await deps.affinityRepository.findByPlayer(playerId)
  }
  
  const snapshot: AffinitySnapshot[] = entries.map(e => ({
    npcName: e.npcName,
    level: e.level,
    score: e.score,
  }))
  
  return { affinitySnapshot: snapshot }
}
```

### Node 8: `recommendationNode`

**File**: `src/interface/graph/nodes/recommendationNode.ts`  
**Reads**: `state.sessionContext`  
**Writes**: `state.recommendationContext`

The most complex node. Finds NPCs the player should meet based on their profile embedding, filtered by feedback history.

```typescript
export async function recommendationNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const playerId = state.sessionContext?.playerId
  
  // Load player embedding from player_embeddings table
  // Fall back to text search if no embedding exists yet
  let candidates: RetrievedDocument[]
  if (playerId) {
    const playerEmbedding = await loadPlayerEmbedding(deps, playerId)
    candidates = playerEmbedding
      ? await deps.vectorRetriever.search(playerEmbedding, { type: 'npc' }, 10)
      : await deps.loreQueryService.search('NPC recomendado para jogador', 10)
  } else {
    candidates = await deps.loreQueryService.search('NPC interessante', 10)
  }
  
  // Exclude intimate NPCs (already maxed out)
  const intimateNames = new Set(
    state.sessionContext?.affinityContext
      .filter(a => a.level === 'intimate')
      .map(a => a.npcName)
  )
  const filtered = candidates.filter(c => !intimateNames.has(c.metadata?.name as string))
  
  // Load feedback weights and rerank
  if (playerId) {
    const weights = await deps.affinityRepository.getFeedbackWeights(playerId)
    filtered.sort((a, b) => {
      const wa = weights[a.metadata?.name as string] ?? 0
      const wb = weights[b.metadata?.name as string] ?? 0
      return (b.score + wb) - (a.score + wa)
    })
  }
  
  // Take top 3 and format
  const top3 = filtered.slice(0, 3)
  const recommendationContext = top3
    .map(doc => doc.document)
    .join('\n\n')
  
  return { recommendationContext }
}
```

### Node 9: `feedbackNode`

**File**: `src/interface/graph/nodes/feedbackNode.ts`  
**Reads**: `state.sessionContext`, `state.slots`  
**Writes**: `state.actionSuccess`, `state.actionError`

Records recommendation feedback. `slots.feedbackSentiment` is `'positive'` or `'negative'`. `slots.characterName` is the NPC the feedback is about.

```typescript
export async function feedbackNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const playerId = state.sessionContext?.playerId
  const npcName = state.slots.characterName as string
  const helpful = state.slots.feedbackSentiment === 'positive'
  
  if (!playerId || !npcName) {
    return { actionSuccess: false, actionError: 'Missing player or NPC context' }
  }
  
  try {
    await deps.affinityRepository.saveFeedback(playerId, npcName, helpful)
    return { actionSuccess: true }
  } catch (error) {
    return { actionSuccess: false, actionError: (error as Error).message }
  }
}
```

### Node 10: `memoryNode`

**File**: `src/interface/graph/nodes/memoryNode.ts`  
**Reads**: `state.sessionContext`  
**Writes**: `state.response` (returns memory summary as response directly, bypassing narrative)

```typescript
export async function memoryNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const threadId = state.sessionContext?.threadId
  if (!threadId) return { response: 'Não tenho memória desta sessão.' }
  
  const summary = await deps.memoryEngine.getSummary(threadId)
  const recentContext = state.sessionContext?.recentContext.slice(-3) ?? []
  
  const memoryResponse = summary
    ? `Memória da sessão: ${summary.slice(0, 300)}\n\nÚltimas mensagens: ${recentContext.join(' | ')}`
    : 'Ainda não há memória acumulada nesta sessão.'
  
  return { response: memoryResponse }
}
```

---

## Update builder.ts and router.ts

### Add nodes to builder
```typescript
.addNode('planner',                withDeps(plannerNode, deps))
.addNode('retrievalOrchestrator',  withDeps(retrievalOrchestratorNode, deps))
.addNode('affinityNode',           withDeps(affinityNode, deps))
.addNode('recommendationNode',     withDeps(recommendationNode, deps))
.addNode('feedbackNode',           withDeps(feedbackNode, deps))
.addNode('memoryNode',             withDeps(memoryNode, deps))
```

### Add edges
```typescript
.addConditionalEdges('planner',           routeAfterPlanner)
.addEdge('retrievalOrchestrator',         'narrativeResponse')
.addEdge('affinityNode',                  'narrativeResponse')
.addEdge('recommendationNode',            'narrativeResponse')
.addEdge('feedbackNode',                  'turnPersistence')  // skip narrative
.addEdge('memoryNode',                    'turnPersistence')  // skip narrative
```

### Update routeAfterIntent in router.ts
```typescript
case 'ask_affinity':         return 'affinityNode'
case 'ask_memory':           return 'memoryNode'
case 'recommend_npcs':
case 'ask_recommendation':   return 'recommendationNode'
case 'feedback_recommendation': return 'feedbackNode'
// For complex queries:
case 'ask_character':
  if (state.complexity === 'multistep') return 'planner'
  return 'simpleRetrieval'
```

### Add routeAfterPlanner
```typescript
export function routeAfterPlanner(state: ValkáriaState): string {
  return (state.plan && state.plan.length > 0) ? 'retrievalOrchestrator' : 'simpleRetrieval'
}
```

---

## Acceptance check

Run `verify-graph` skill — Tests 5 and 6 must pass:
- Test 5: "Qual minha afinidade com Aaliyah?" → affinity level in Portuguese response
- Test 6: "Recomende-me um NPC para conhecer" → 3 NPC recommendations in Portuguese
