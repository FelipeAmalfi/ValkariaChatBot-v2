# Phase 07 — Chat Service Core

**Agent**: `graph-wiring` (state + builder skeleton) + `graph-nodes` (sanitize, identifyIntent, sessionLoad)  
**Depends on**: Phase 02, 03, 04, 06  
**Service**: `services/chat-service/` (port 3003)

---

## What you're building

The LangGraph pipeline foundation. This phase establishes the state machine shape, the dependency injection pattern, and the first 3 nodes that every message passes through. After this phase, the REPL works for basic message routing.

**Critical upgrade from V1**: This uses `PostgresSaver` (not `MemorySaver`) for LangGraph checkpointing. This enables running multiple chat-service instances simultaneously, since state is stored in PostgreSQL rather than in-process memory.

---

## Directory structure

```
services/chat-service/
├── src/
│   ├── infrastructure/
│   │   └── ai/
│   │       ├── OpenRouterProvider.ts
│   │       └── cosineSimilarity.ts
│   ├── interface/
│   │   ├── graph/
│   │   │   ├── state.ts
│   │   │   ├── dependencies.ts
│   │   │   ├── builder.ts
│   │   │   ├── router.ts
│   │   │   └── nodes/
│   │   │       ├── sanitizeNode.ts
│   │   │       ├── identifyIntentNode.ts
│   │   │       └── sessionLoadNode.ts
│   │   └── http/
│   │       ├── server.ts
│   │       ├── controllers/
│   │       │   └── ChatController.ts
│   │       └── errorHandler.ts
│   ├── shared/
│   │   └── prompts/
│   │       └── v1/
│   │           └── identifyIntent.ts
│   ├── composition/
│   │   └── container.ts
│   └── index.ts
├── dev/
│   └── repl.ts            (interactive REPL for graph:dev)
├── tests/
│   └── unit/
│       └── nodes/
│           ├── sanitizeNode.test.ts
│           └── identifyIntentNode.test.ts
├── package.json
└── tsconfig.json
```

---

## Packages to install

```bash
npm install fastify @fastify/jwt @fastify/cors @fastify/helmet \
  @langchain/langgraph @langchain/langgraph-checkpoint-postgres \
  @langchain/core openai zod \
  @valkaria/domain @valkaria/config @valkaria/database \
  -w @valkaria/chat-service

npm install -D vitest @types/node tsx -w @valkaria/chat-service
```

---

## Files to create

### `src/interface/graph/state.ts`
See `spec/agents/graph-wiring.md` for the complete `ValkáriaStateAnnotation` definition. Implement it exactly as specified — the annotation reducers are critical for correct slot accumulation.

### `src/interface/graph/dependencies.ts`
```typescript
import type { CharacterRepository, PlayerRepository, AffinityRepository,
  LocationRepository, SessionStore, MemoryEngine, VectorRetriever,
  LoreQueryService, AIProvider } from '@valkaria/domain'
import type { Driver } from 'neo4j-driver'

export interface GraphDependencies {
  characterRepository: CharacterRepository
  playerRepository: PlayerRepository
  affinityRepository: AffinityRepository
  locationRepository: LocationRepository
  vectorRetriever: VectorRetriever
  loreQueryService: LoreQueryService
  sessionStore: SessionStore
  memoryEngine: MemoryEngine
  neo4jDriver: Driver
  aiProvider: AIProvider
}
```

### `src/interface/graph/nodes/sanitizeNode.ts`
Implement as described in `spec/agents/graph-nodes.md`. Clean input, detect injection patterns, return `{ injectionDetected, messages }`.

### `src/shared/prompts/v1/identifyIntent.ts`
```typescript
export function getSystemPrompt(): string {
  return `You are an intent classifier for the Valkária RPG chatbot.
  
Classify the user message into one of these 24 intents and extract relevant slots.
Output ONLY valid JSON matching the schema below. No preamble, no explanation.

INTENTS:
identify_player, identify_dm, ask_character, ask_relationship, ask_benefits,
ask_affinity, ask_location, ask_lore, search_npcs, search_locations,
ask_recommendation, recommend_npcs, feedback_recommendation, increase_affinity,
ask_memory, ask_quests, ask_faction, ask_map, describe_self,
chat, greeting, farewell, help, unknown

SLOTS to extract when present:
- characterName: NPC name mentioned
- locationName: location mentioned  
- topic: general topic
- affinityTarget: NPC name for affinity queries
- feedbackSentiment: "positive" | "negative" for feedback
- requestedFields: array of fields requested
- relationshipTarget: NPC name for relationship queries
- playerName: player name for identity

OUTPUT SCHEMA:
{
  "intent": "<one of the 24 intents>",
  "slots": { <extracted slots> },
  "confidence": <0.0-1.0>,
  "complexity": "simple" | "complex" | "multistep",
  "requiresRetrieval": true | false
}

complexity rules:
- simple: single entity lookup, direct answer
- complex: multiple sources needed, relationships
- multistep: requires planning across 3+ data sources`
}

export function getUserPromptTemplate(message: string, context?: string): string {
  return `${context ? `Session context: ${context}\n` : ''}Message: ${message}`
}
```

### `src/interface/graph/nodes/identifyIntentNode.ts`
Calls `aiProvider.complete()` with the identifyIntent prompts (task: 'classification', temperature: 0.1). Parses the JSON response. Returns `{ intent, slots, confidence, complexity, requiresRetrieval, actionSuccess: null, actionError: null, actionData: null }`. Reset action fields each turn.

On JSON parse failure: return `{ intent: 'unknown', slots: {}, confidence: 0, complexity: 'simple', requiresRetrieval: false }`.

### `src/interface/graph/nodes/sessionLoadNode.ts`
Loads `SessionContext` from Redis using the `thread_id` from LangGraph's config object. If no session exists, creates a default one: `{ threadId, currentRole: 'guest', validationState: 'pending', affinityContext: [], recentContext: [] }`.

To access `thread_id` in a LangGraph node, use the config object passed as the third argument:
```typescript
export async function sessionLoadNode(
  state: ValkáriaState,
  deps: GraphDependencies,
  config?: RunnableConfig
): Promise<Partial<ValkáriaState>> {
  const threadId = config?.configurable?.thread_id as string
  // ...
}
```

### `src/interface/graph/builder.ts`
Build the graph skeleton with just these 3 nodes + routes. Other nodes return from `narrativeResponseNode` stub:

```typescript
export function buildValkáriaGraph(deps: GraphDependencies, pgPool: Pool) {
  const checkpointer = new PostgresSaver(pgPool)
  
  const graph = new StateGraph(ValkáriaStateAnnotation)
    .addNode('sanitize',       withDeps(sanitizeNode, deps))
    .addNode('identifyIntent', withDeps(identifyIntentNode, deps))
    .addNode('sessionLoad',    withDeps(sessionLoadNode, deps))
    .addNode('narrativeResponse', async (state) => ({
      response: `[Phase 07 stub] Intent: ${state.intent}, Message received.`
    }))
    .addNode('turnPersistence', async () => ({}))
    
    .addEdge('__start__', 'sanitize')
    .addConditionalEdges('sanitize', routeAfterSanitize)
    .addEdge('identifyIntent', 'sessionLoad')
    .addConditionalEdges('sessionLoad', () => 'narrativeResponse')
    .addEdge('narrativeResponse', 'turnPersistence')
    .addEdge('turnPersistence', '__end__')
  
  return graph.compile({ checkpointer })
}
```

Replace the stub nodes in phases 08-11.

### `src/interface/graph/router.ts`
Implement `routeAfterSanitize` only (returns `'identifyIntent'` or `'__end__'`). Other router functions will be added in phases 08-11.

### `src/interface/http/server.ts` + `ChatController.ts`
- `POST /chat` body: `{ message: string }` header: `x-thread-id`
- Extract `threadId` from `x-thread-id` header (default to `uuid()` if missing)
- Invoke the compiled graph: `await graph.invoke({ messages: [new HumanMessage(message)] }, { configurable: { thread_id: threadId } })`
- Return `{ response: result.response }`

### `dev/repl.ts`
Interactive REPL for local testing:
```typescript
import readline from 'readline'
import { createContainer } from '../src/composition/container'
import { buildValkáriaGraph } from '../src/interface/graph/builder'
import { HumanMessage } from '@langchain/core/messages'

const THREAD_ID = 'dev-session-001'
const { graph } = await buildGraph()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log(`ValkáriaGraph Dev REPL\nThread ID: ${THREAD_ID}\nType /exit to quit\n`)

rl.on('line', async (input) => {
  if (input.trim() === '/exit') { rl.close(); process.exit(0) }
  const result = await graph.invoke(
    { messages: [new HumanMessage(input)] },
    { configurable: { thread_id: THREAD_ID } }
  )
  console.log(`\nNarrador: ${result.response}\n`)
})
```

Add to `package.json` scripts: `"graph:dev": "tsx dev/repl.ts"`

---

## Key implementation notes

1. `PostgresSaver` must be initialized with the pg Pool — call `await checkpointer.setup()` once at startup to create the checkpoint tables.
2. `withDeps` helper: `const withDeps = (fn, deps) => (state, config) => fn(state, deps, config)`
3. The `identifyIntentNode` must handle LLM responses that wrap JSON in markdown code blocks: strip ` ```json ` and ` ``` ` before parsing.
4. For the graph REPL, load `.env` via `import 'dotenv/config'` at the top of `repl.ts`.

---

## Environment variables needed

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/valkaria
REDIS_URL=redis://localhost:6379
CHAT_PORT=3003
JWT_SECRET=change-me-to-32-char-minimum-secret
OPENROUTER_API_KEY=sk-or-v1-your-key-here
FRONTEND_URL=http://localhost:3000
AI_CLASSIFICATION_MODEL=mistralai/mistral-7b-instruct:free
```

---

## Acceptance check

```bash
npm run graph:dev -w @valkaria/chat-service
```

Run `verify-graph` skill — Test 1 (greeting) and Test 2 (identity flow trigger) should work. Expected: Portuguese stub response showing the classified intent.
