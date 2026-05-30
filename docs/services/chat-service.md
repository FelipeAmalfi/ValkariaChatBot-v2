# chat-service

**Port**: 3003 | **Package**: `@valkaria/chat-service`

## Responsibilities

Core AI engine. Runs the LangGraph `ValkáriaGraph` state machine for every conversation turn.

- Horizontally scalable via `PostgresSaver` — state persists to PostgreSQL, not process memory
- Every conversation turn is a stateless HTTP request: load state → run graph → persist state
- Multiple instances can run concurrently — each thread (conversation) is isolated by `thread_id`
- Redis stores lightweight `SessionContext` for fast reads (not the primary state store)
- Validates JWT locally (same `JWT_SECRET`, no auth-service roundtrip)

## API Endpoints

### `POST /chat`

Send a message and receive an NPC response.

**Headers:** `Authorization: Bearer <jwt>`, `x-thread-id: <uuid>`

**Request body:**
```json
{
  "message": "string"
}
```

**Response `200`:**
```json
{
  "response": "string",
  "threadId": "uuid",
  "intent": "string"
}
```

**Errors:** `401 UnauthorizedError` (missing/invalid JWT), `400 ValidationError` (empty message).

## LangGraph Pipeline

The `ValkáriaGraph` is a 16-node state machine with 24 intents.

```
sanitize → identifyIntent → sessionLoad → [router] →
  ├── greetingNode
  ├── questNode
  ├── tradeNode
  ├── affinityNode
  ├── loreNode
  ├── combatNode
  ├── worldQueryNode (→ Neo4j Cypher)
  ├── recommendationNode
  ├── dmCommandNode (DM only)
  └── fallbackNode
       ↓
narrativeResponse → turnPersistence
```

**State shape** (`ValkáriaState`):
- `messages`: conversation history (append-only reducer)
- `intent`: classified intent from current turn
- `sessionContext`: player role, affinity snapshot, recent messages
- `worldContext`: NPC/location data fetched during turn
- `plan`: multi-step plan for complex intents
- `response`: final NPC response text

**Node isolation** (see [ADR-007](/architecture/decisions#adr-007-langgraph-node-isolation)): each node is a pure async function `(state, deps) => Partial<ValkáriaState>`.

## Data owned

- `memory_summaries` — thread_id, player_id, summary, turn_count, updated_at
- `checkpoints` — auto-managed by PostgresSaver (do not write directly)
- `session:{threadId}` in Redis (TTL 24h)

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `CHAT_PORT` | No (default: 3003) | HTTP port |
| `JWT_SECRET` | Yes | Must match auth-service |
| `OPENROUTER_API_KEY` | Yes | For LLM and embedding calls |
| `NEO4J_URI` | Yes | Neo4j Bolt connection string |
| `NEO4J_USER` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | Yes | Neo4j password |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `FRONTEND_URL` | Yes | CORS allowed origin |
| `AI_DEFAULT_MODEL` | No | Default OpenRouter model |
| `AI_CHAT_MODEL` | No | Model for narrative responses |
| `AI_CLASSIFICATION_MODEL` | No | Model for intent classification |
| `AI_CYPHER_MODEL` | No | Model for Cypher generation |
| `AI_PLAN_MODEL` | No | Model for plan generation |
| `AI_EMBEDDING_MODEL` | No | Embedding model (default: text-embedding-3-small) |
| `AI_EMBEDDING_DIMENSIONS` | No (default: 1536) | Vector dimensions |
| `AI_FALLBACK_MODEL` | No | Fallback model on errors |

## Key design decisions

- **[ADR-002](/architecture/decisions#adr-002-postgressaver-for-langgraph-not-memorysaver)**: PostgresSaver — enables horizontal scaling, survives restarts
- **[ADR-003](/architecture/decisions#adr-003-header-based-threading-x-thread-id)**: `x-thread-id` header for session identity (not cookies)
- **[ADR-007](/architecture/decisions#adr-007-langgraph-node-isolation)**: Pure node functions with injected dependencies — independently testable
- **[ADR-006](/architecture/decisions#adr-006-prompt-versioning)**: Versioned prompts in `shared/prompts/v1/` — rollback without code changes
