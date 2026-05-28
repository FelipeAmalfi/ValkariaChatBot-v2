# ValkáriaV2 — Architectural Decisions

Key decisions carried forward from V1, plus new decisions for V2. Each includes the reasoning so future developers can revisit if constraints change.

---

## ADR-001: Narrative Authentication for Players

**Decision**: Players authenticate by answering a story question derived from their registered profile. No passwords.

**Reasoning**: Keeps RPG immersion intact. Players think of it as "remembering" their character's backstory, not logging in. The cosine similarity threshold (0.6) allows natural language variation without requiring verbatim recall.

**Implementation**:
1. Registration: player provides background, personality, interests in natural language
2. Auth initiate: system picks a random field, embeds it, generates a narrative question via LLM, stores `AuthChallenge` in Redis with the embedding (5min TTL)
3. Auth validate: embed the player's answer, compute cosine similarity vs stored embedding, issue JWT if ≥ 0.6

**Threshold**: 0.6 (configurable via `SEMANTIC_AUTH_THRESHOLD`). Too low (< 0.5) allows impersonation. Too high (> 0.75) fails on natural language paraphrasing.

**DM auth**: Simple password via `DM_PASSWORD` env var. DM is a single trusted user, no per-DM registration needed.

---

## ADR-002: PostgresSaver for LangGraph (not MemorySaver)

**Decision**: Use `@langchain/langgraph-checkpoint-postgres` instead of `MemorySaver`.

**Reasoning**: `MemorySaver` stores conversation state in process heap. This means:
- You can only run one chat-service instance (no horizontal scaling)
- State is lost on process restart
- Can't inspect conversation state from outside the process

`PostgresSaver` persists full state to PostgreSQL after every graph step. Multiple chat-service instances can run simultaneously because each loads the state from the DB at the start of each turn and saves it at the end.

**Trade-off**: Slight latency increase (~5-10ms per checkpoint read/write). Acceptable for conversational RPG use case (turns are seconds apart).

---

## ADR-003: Header-Based Threading (x-thread-id)

**Decision**: Conversation sessions are identified by `x-thread-id` HTTP header, not cookies.

**Reasoning**: 
- Frontend and API are on different domains in production (Vercel vs Render)
- Cookie `sameSite: 'none'` requires HTTPS everywhere, complicates local dev
- Header-based approach works with any HTTP client, no CORS cookie preflight issues
- Web client stores `threadId` in localStorage and sends it with every chat request

**Web client**: On first visit to `/chat`, generate a UUID and store it in `localStorage['valkaria:threadId']`. Subsequent visits reuse it, enabling conversation continuity across page reloads.

---

## ADR-004: AppError Hierarchy

**Decision**: All domain errors extend `AppError` base class with a `statusCode` property.

**Reasoning**: Centralizes HTTP status mapping in one place (error handler plugin). Services never import `http-status-codes` or hard-code 404/401 — they throw typed errors.

```typescript
class AppError extends Error {
  constructor(public message: string, public statusCode: number) { super(message) }
}
class ValidationError extends AppError { constructor(m: string) { super(m, 400) } }
class NotFoundError extends AppError { constructor(m: string) { super(m, 404) } }
class UnauthorizedError extends AppError { constructor(m: string) { super(m, 401) } }
class ForbiddenError extends AppError { constructor(m: string) { super(m, 403) } }
class ConflictError extends AppError { constructor(m: string) { super(m, 409) } }
class InfrastructureError extends AppError { constructor(m: string) { super(m, 500) } }
class RepositoryError extends InfrastructureError {}
class AIProviderError extends AppError { constructor(m: string) { super(m, 502) } }
```

Fastify error handler catches `AppError` instances and returns `{ error: message, statusCode }`. Non-AppError exceptions become 500 with a generic message.

---

## ADR-005: Affinity Level Mapping

**Decision**: Affinity is stored as a numeric score (0–100) and mapped to named levels.

| Score | Level |
|---|---|
| 0 | none |
| 1–25 | cordial |
| 26–75 | loyal |
| 76–100 | intimate |

**Reasoning**: Numeric score allows gradual progression and fractional updates. Named levels provide semantic meaning for UI and game mechanics. `intimate` NPCs are excluded from the recommendation engine (they're already "maxed out").

**NPC benefits by level**: Each NPC has three benefit tiers (in `characters.metadata.benefits_cordial/loyal/intimate`), unlocked when the player reaches that affinity level.

---

## ADR-006: Prompt Versioning

**Decision**: Store prompt templates in versioned directories: `shared/prompts/v1/identifyIntent.ts`.

**Reasoning**: Allows A/B testing between prompt versions and immediate rollback if a new prompt degrades quality. Each prompt file exports `getSystemPrompt()` and `getUserPromptTemplate()` functions.

Future versions go in `shared/prompts/v2/`, etc. The model config controls which version is active.

---

## ADR-007: LangGraph Node Isolation

**Decision**: Each LangGraph node is a pure async function: `(state: ValkáriaState, deps: GraphDependencies) => Promise<Partial<ValkáriaState>>`.

**Reasoning**:
- Nodes are independently unit-testable without starting the graph
- Nodes return only the fields they update (`Partial<>`) — no accidental overwrites
- Dependencies are injected (not imported) — easy to mock in tests
- Nodes never import from other nodes — prevents circular dependencies

**Consequence**: The graph builder (`builder.ts`) is the only place that knows about all nodes. Adding a node never modifies any other node file.

---

## ADR-008: Shared JWT Secret Across Services

**Decision**: All services that verify JWTs use the same `JWT_SECRET`.

**Reasoning**: In V2, only `auth-service` issues JWTs. `chat-service` and `world-service` only verify them locally — no network call back to auth-service needed for JWT validation. This keeps auth fast and auth-service simple.

**Security**: `JWT_SECRET` must be the same value in all service environments. Rotate all at once if compromised. In production, use a secret manager (Render secret env vars, Vercel env vars).

---

## ADR-009: Nginx as API Gateway (not Fastify Proxy)

**Decision**: Use Nginx (nginx:1.27-alpine) as the API gateway instead of building a Fastify proxy service.

**Reasoning**:
- Nginx handles rate limiting, SSL termination, routing, and header injection natively with zero code
- A Fastify proxy would require maintaining another Node.js process with its own bugs and updates
- For the scale of this project, Nginx is significantly over-provisioned (handles ~100K req/s)
- Adding new services only requires updating `nginx.conf` — no code changes

**Trade-off**: Less flexibility than a programmatic gateway (can't do content-based routing). Acceptable for V2.

---

## ADR-010: Immersive Dark Fantasy UI (not Minimal)

**Decision**: The web interface prioritizes RPG atmosphere over minimalism.

**Key choices**:
- **Split-pane layout**: Chat (60%) + World Context (40%) always visible on desktop
- **Cinzel font** for headings: medieval serif feel
- **Gold accents** (#c9a84c): NPC names, important UI elements
- **NPC portrait cards**: faction-colored SVG placeholders (real portraits future scope)
- **Affinity 4-dot meter**: ○○○○ → ●○○○ → ●●○○ → ●●●○ → ●●●●
- **Framer Motion** for all transitions — no abrupt state changes
- **Mobile**: single pane, world context in bottom sheet

**Rationale**: The RPG setting is the main differentiator. A generic chat UI would make the product feel like a wrapper around an LLM. The atmosphere is the product.
