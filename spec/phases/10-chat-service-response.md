# Phase 10 — Chat Service Response + Full Wiring

**Agent**: `graph-nodes` (response nodes) + `graph-wiring` (complete routing)  
**Depends on**: Phase 09  
**Service**: `services/chat-service/`

---

## What you're building

The final two nodes of the graph and the complete wiring that connects all 16 nodes. After this phase, the full LangGraph pipeline is operational: intent classification, retrieval, reasoning, narrative response, and session persistence.

---

## Node 11: `narrativeResponseNode` (replace stub)

**File**: `src/interface/graph/nodes/narrativeResponseNode.ts`  
**Reads**: All retrieval context fields, `state.intent`, `state.sessionContext`, `state.affinitySnapshot`, `state.recommendationContext`  
**Writes**: `state.response`

This is the most important node — it generates the final narrative response.

```typescript
export async function narrativeResponseNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const systemPrompt = buildSystemPrompt(state)
  const userPrompt = buildUserPrompt(state)
  
  const { content } = await deps.aiProvider.complete([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], 'chat', 0.7, 1024)
  
  return { response: content }
}
```

### System prompt builder

```typescript
function buildSystemPrompt(state: ValkáriaState): string {
  const role = state.sessionContext?.currentRole ?? 'guest'
  const memorySummary = state.sessionContext?.memorySummary
  const recentContext = state.sessionContext?.recentContext.slice(-3).join('\n') ?? ''
  
  const roleInstruction = role === 'DM'
    ? 'O usuário é o Mestre do Jogo (DM). Forneça informações completas e detalhadas, incluindo dados de bastidores, pontuações de afinidade e informações confidenciais dos NPCs.'
    : role === 'PLAYER'
    ? 'O usuário é um jogador. Forneça apenas informações que o personagem conheceria dentro do mundo do jogo. Sem informações meta-game.'
    : 'O usuário ainda não está autenticado. Apresente o mundo e encoraje o registro.'
  
  return `Você é o narrador de Candessah, uma cidade de repouso em Valkária — um mundo de fantasia rico em lore.
Responda SEMPRE em português brasileiro.
Mantenha um tom narrativo de RPG, evocativo e imersivo.

${roleInstruction}

${memorySummary ? `Contexto da memória: ${memorySummary.slice(0, 300)}` : ''}
${recentContext ? `Contexto recente:\n${recentContext}` : ''}`
}

function buildUserPrompt(state: ValkáriaState): string {
  const parts: string[] = []
  
  const lastMessage = state.messages[state.messages.length - 1]
  parts.push(`Mensagem do usuário: ${String(lastMessage?.content ?? '')}`)
  
  if (state.retrievedContext) {
    parts.push(`\nInformações relevantes encontradas:\n${state.retrievedContext}`)
  }
  if (state.graphContext) {
    parts.push(`\nDados do grafo de relacionamentos:\n${state.graphContext}`)
  }
  if (state.affinitySnapshot.length > 0) {
    const affinities = state.affinitySnapshot
      .map(a => `${a.npcName}: ${a.level} (${a.score})`)
      .join(', ')
    parts.push(`\nAfinidades do jogador: ${affinities}`)
  }
  if (state.recommendationContext) {
    parts.push(`\nNPCs recomendados:\n${state.recommendationContext}`)
    parts.push('\nApresente estes NPCs de forma narrativa e imersiva. Mencione cada um com um breve motivo pelo qual seriam interessantes.')
  }
  
  return parts.join('\n')
}
```

### Node 12: `turnPersistenceNode` (replace stub)

**File**: `src/interface/graph/nodes/turnPersistenceNode.ts`  
**Reads**: `state.messages`, `state.sessionContext`, `state.intent`  
**Writes**: nothing (side effects only)

```typescript
export async function turnPersistenceNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const threadId = state.sessionContext?.threadId
  if (!threadId) return {}
  
  const lastMessage = state.messages[state.messages.length - 1]
  const messageText = String(lastMessage?.content ?? '')
  
  // Append to memory (non-fatal if fails)
  try {
    await deps.memoryEngine.append(threadId, messageText)
  } catch { /* intentionally ignored */ }
  
  // Update Redis session context with recent context
  try {
    const updatedContext: SessionContext = {
      ...state.sessionContext!,
      recentContext: [
        ...(state.sessionContext?.recentContext ?? []).slice(-4),
        messageText,
      ].slice(-5),
      lastUpdated: new Date().toISOString(),
    }
    await deps.sessionStore.save(threadId, updatedContext)
  } catch { /* intentionally ignored */ }
  
  return {}
}
```

---

## Complete the graph wiring

### Final `builder.ts`

Replace all stubs with real node imports. The complete graph has exactly these nodes:

```
sanitize → identifyIntent → sessionLoad
sessionLoad →(route)→ identityFlow | affinityNode | memoryNode |
                       recommendationNode | feedbackNode |
                       cypherGenerate | planner | simpleRetrieval |
                       graphRetrieval | narrativeResponse

cypherGenerate → cypherExecute
cypherExecute →(route)→ cypherGenerate (retry) | narrativeResponse
planner →(route)→ retrievalOrchestrator | simpleRetrieval
retrievalOrchestrator → narrativeResponse
simpleRetrieval → narrativeResponse
graphRetrieval → narrativeResponse
affinityNode → narrativeResponse
recommendationNode → narrativeResponse
identityFlow → narrativeResponse
narrativeResponse → turnPersistence
feedbackNode → turnPersistence
memoryNode → turnPersistence
turnPersistence → __end__
```

### Also add: `identityFlowNode`

**File**: `src/interface/graph/nodes/identityFlowNode.ts`

Handles both player auth flow and DM auth. Two sub-cases:

1. `identify_player`:
   - If no challenge in progress: call InitiatePlayerAuthUseCase internally, update session to `validationState: 'challenged'`, return narrative challenge question
   - If challenge in progress (player answering): validate the answer, update session role to PLAYER if valid, return narrative success/failure message

2. `identify_dm`:
   - Extract password from message
   - Compare to `DM_PASSWORD` env var
   - If match: update session to `currentRole: 'DM'`, `validationState: 'validated'`
   - Return narrative response confirming DM access or rejection

Note: `identityFlowNode` manages session state transitions directly (updating `sessionStore`) rather than leaving it to `turnPersistenceNode`.

---

## Add `nodes/index.ts` barrel export

```typescript
export { sanitizeNode } from './sanitizeNode'
export { identifyIntentNode } from './identifyIntentNode'
export { sessionLoadNode } from './sessionLoadNode'
export { identityFlowNode } from './identityFlowNode'
export { simpleRetrievalNode } from './simpleRetrievalNode'
export { graphRetrievalNode } from './graphRetrievalNode'
export { cypherGenerateNode } from './cypherGenerateNode'
export { cypherExecuteNode } from './cypherExecuteNode'
export { plannerNode } from './plannerNode'
export { retrievalOrchestratorNode } from './retrievalOrchestratorNode'
export { affinityNode } from './affinityNode'
export { recommendationNode } from './recommendationNode'
export { feedbackNode } from './feedbackNode'
export { memoryNode } from './memoryNode'
export { narrativeResponseNode } from './narrativeResponseNode'
export { turnPersistenceNode } from './turnPersistenceNode'
```

---

## Update `composition/container.ts`

The container creates all dependency instances and passes them to `buildValkáriaGraph`:

```typescript
export function createContainer(env: ReturnType<typeof validateEnv>) {
  const pool = getPgPool(env.DATABASE_URL)
  const driver = getNeo4jDriver(env.NEO4J_URI, env.NEO4J_USER, env.NEO4J_PASSWORD)
  const redis = getRedisClient(env.REDIS_URL)
  const modelConfig = createModelConfig(env)
  
  const aiProvider = new OpenRouterProvider(env.OPENROUTER_API_KEY, modelConfig)
  const characterRepository = new PgCharacterRepository(pool)
  // ... all other repositories
  
  const deps: GraphDependencies = {
    characterRepository,
    playerRepository,
    affinityRepository,
    locationRepository,
    vectorRetriever,
    loreQueryService,
    sessionStore,
    memoryEngine,
    neo4jDriver: driver,
    aiProvider,
  }
  
  const graph = buildValkáriaGraph(deps, pool)
  return { graph, pool, driver, redis }
}
```

---

## Acceptance check

Run full `verify-graph` skill — all 6 tests must pass:
- Test 1: Greeting → Portuguese narrative welcome
- Test 2: Identity trigger → auth challenge or acknowledgment
- Test 3: NPC query → Aaliyah description
- Test 4: Location query → NPCs via Cypher
- Test 5: Affinity → relationship level
- Test 6: Recommendation → 3 NPCs suggested

Also run `verify-api` skill — test 4 must pass (chat endpoint returns real narrative response).
