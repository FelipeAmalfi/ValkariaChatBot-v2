# Phase 08 — Chat Service Retrieval

**Agent**: `graph-nodes`  
**Depends on**: Phase 07  
**Service**: `services/chat-service/`

---

## What you're building

The retrieval nodes for the chat service graph: simple lookup via vector/text search, graph-based relationship queries via Neo4j, and LLM-driven Cypher generation with guardrails. After this phase, NPC and location queries return real data.

---

## Nodes to implement (one at a time)

Work on each node file in isolation. Load only `state.ts`, `dependencies.ts`, and the current node file.

### Node 1: `simpleRetrievalNode`

**File**: `src/interface/graph/nodes/simpleRetrievalNode.ts`  
**Reads**: `state.intent`, `state.slots`  
**Writes**: `state.retrievedContext`

Strategy by intent:
- `ask_character`: Try `characterRepository.findByName(slots.characterName)` first. If not found, fall back to `vectorRetriever.search()` with `cmetadata.type = 'npc'`.
- `ask_location`: Use `locationRepository.findByName(slots.locationName)` first, then vector search with `cmetadata.type = 'location'`.
- `ask_lore` / `search_npcs` / `search_locations`: Use `loreQueryService.search(slots.topic || lastMessage)` which runs vector search.
- `ask_benefits`: Find NPC by name, extract `metadata.benefits_*` fields.

Format the retrieved data as a readable string summary for injection into the narrative response prompt. Example:
```
Aaliyah é uma moreau felina que trabalha como recepcionista na Casa de Banho em Candessah.
Gosta de: cochilos, tricô, perfumes, fofoca.
Não gosta de: cheiros ruins, barulho, chuva.
```

```typescript
export async function simpleRetrievalNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  try {
    let retrievedContext: string | null = null
    const { intent, slots } = state
    
    if (intent === 'ask_character' && slots.characterName) {
      const character = await deps.characterRepository.findByName(String(slots.characterName))
      if (character) {
        retrievedContext = formatCharacter(character)
      } else {
        // Vector search fallback
        const embedding = await deps.aiProvider.embed(String(slots.characterName))
        const docs = await deps.vectorRetriever.search(embedding, { type: 'npc' }, 3)
        retrievedContext = docs.map(d => d.document).join('\n\n')
      }
    }
    // ... other intents
    
    return { retrievedContext }
  } catch {
    return { retrievedContext: null }
  }
}
```

### Node 2: `graphRetrievalNode`

**File**: `src/interface/graph/nodes/graphRetrievalNode.ts`  
**Reads**: `state.intent`, `state.slots`  
**Writes**: `state.graphContext`

Used for queries that need graph relationships rather than text search. Executes predefined Cypher queries (not LLM-generated) for common patterns:

- NPCs at a location: `MATCH (n:NPC)-[:LOCATED_IN]->(l:Location {name: $location}) RETURN n.name, n.faction`
- NPC interests: `MATCH (n:NPC {name: $name})-[:LIKES]->(i:Interest) RETURN i.name`

These are hand-written safe queries — use this node for simple relationship lookups. For complex queries, `cypherGenerateNode` is used.

### Node 3: `cypherGenerateNode`

**File**: `src/interface/graph/nodes/cypherGenerateNode.ts`  
**Reads**: `state.intent`, `state.slots`, `state.complexity`  
**Writes**: `state.cypherQueries`

Calls `aiProvider.complete()` with the Cypher generation prompt (task: 'cypher', temperature: 0.2). Parses the JSON array of query strings from the response.

```typescript
import { getSystemPrompt, getUserPromptTemplate } from '../../shared/prompts/v1/generateCypher'

export async function cypherGenerateNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const { content } = await deps.aiProvider.complete([
    { role: 'system', content: getSystemPrompt() },
    { role: 'user', content: getUserPromptTemplate(state.intent!, state.slots) }
  ], 'cypher', 0.2, 1024)
  
  const queries = parseCypherResponse(content)
  return { cypherQueries: queries.slice(0, 5), cypherRetryCount: 0 }
}
```

### Prompt: `src/shared/prompts/v1/generateCypher.ts`

System prompt must include:
- Neo4j schema (NPC, Location, Interest nodes; LOCATED_IN, LIKES relationships)
- Security: READ ONLY — no CREATE, MERGE, DELETE, DROP, CALL in queries
- All string comparisons: `toLower(n.name) = toLower($param)` — case-insensitive
- Max 5 queries
- Max 1000 chars per query
- Output: JSON array of Cypher query strings (no explanations)

```
Output format: ["MATCH ...", "MATCH ..."]
```

### Node 4: `cypherExecuteNode`

**File**: `src/interface/graph/nodes/cypherExecuteNode.ts`  
**Reads**: `state.cypherQueries`, `state.cypherRetryCount`  
**Writes**: `state.cypherResults`, `state.cypherRetryCount`, `state.graphContext`, `state.actionError`

```typescript
export async function cypherExecuteNode(
  state: ValkáriaState,
  deps: GraphDependencies
): Promise<Partial<ValkáriaState>> {
  const results: unknown[] = []
  const session = deps.neo4jDriver.session()
  
  try {
    for (const query of state.cypherQueries) {
      if (!isSafeCypher(query)) continue
      const result = await session.run(query)
      results.push(...result.records.map(r => r.toObject()))
    }
    
    const deduplicated = deduplicateByName(results)
    const graphContext = formatCypherResults(deduplicated)
    
    return {
      cypherResults: deduplicated,
      graphContext,
      cypherRetryCount: state.cypherRetryCount + 1,
      actionError: null,
    }
  } catch (error) {
    return {
      actionError: (error as Error).message,
      cypherRetryCount: state.cypherRetryCount + 1,
    }
  } finally {
    await session.close()
  }
}
```

#### `isSafeCypher(query: string): boolean`
Rejects queries containing: `CREATE`, `MERGE`, `DELETE`, `DROP`, `SET`, `REMOVE`, `CALL`, `LOAD CSV`. Case-insensitive check. Return false if any are found.

---

## Update builder.ts and router.ts

### Add to `builder.ts`
```typescript
.addNode('simpleRetrieval',   withDeps(simpleRetrievalNode, deps))
.addNode('graphRetrieval',    withDeps(graphRetrievalNode, deps))
.addNode('cypherGenerate',    withDeps(cypherGenerateNode, deps))
.addNode('cypherExecute',     withDeps(cypherExecuteNode, deps))
```

And edges:
```typescript
.addEdge('cypherGenerate', 'cypherExecute')
.addConditionalEdges('cypherExecute', routeAfterCypherExecute)
// Simple/graph retrieval both go to narrativeResponse
.addEdge('simpleRetrieval', 'narrativeResponse')
.addEdge('graphRetrieval', 'narrativeResponse')
```

### Update `router.ts` routeAfterIntent
Add cases for retrieval intents:
```typescript
case 'ask_character':
case 'ask_location':
case 'ask_lore':
case 'search_npcs':
  return state.complexity === 'multistep' ? 'planner' : 'simpleRetrieval'
case 'ask_relationship':
case 'ask_faction':
  return 'cypherGenerate'
```

Add `routeAfterCypherExecute`: if `actionError && cypherRetryCount <= 1` → `'cypherGenerate'`, else → `'narrativeResponse'`.

---

## Update narrativeResponseNode stub

The stub in phase 07 returned a placeholder. Update it to inject the retrieved context:
```typescript
.addNode('narrativeResponse', async (state) => ({
  response: `[Phase 08 stub] Context: ${state.retrievedContext ?? state.graphContext ?? 'none'}`
}))
```

---

## Key implementation notes

1. `simpleRetrievalNode` must never throw — catch all errors and return `{ retrievedContext: null }`.
2. `isSafeCypher` is a security-critical function — test it thoroughly with test cases.
3. Cypher results may have duplicate NPC names (from multiple queries) — deduplicate by `n.name` before formatting.
4. The Cypher generation prompt must be very explicit about the READ-only rule — LLMs sometimes generate `MERGE` for "create if not exists" patterns.

---

## Acceptance check

Run `verify-graph` skill — Tests 3 and 4 must pass:
- Test 3: "Me fale sobre Aaliyah" → real NPC data in response
- Test 4: "Quem mora em Candessah?" → Cypher query executes, NPCs listed in Portuguese
