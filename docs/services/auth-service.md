# auth-service

**Port**: 3002 | **Package**: `@valkaria/auth-service`

## Responsibilities

Standalone authentication microservice. Stateless — scales horizontally with zero coordination.

- Player registration: store name, class, race, background, personality, interests
- Narrative auth (players): embed a random profile field → ask a story question → validate the answer via cosine similarity (threshold 0.6)
- DM auth: simple `DM_PASSWORD` env var comparison
- JWT issuance: signs tokens with shared `JWT_SECRET`, role: `PLAYER | DM`
- No database reads during JWT verification (stateless)

## API Endpoints

### `POST /auth/register`

Register a new player character.

**Request body:**
```json
{
  "name": "string",
  "class": "string",
  "race": "string",
  "background": "string",
  "personality": "string",
  "interests": "string"
}
```

**Response `201`:**
```json
{ "playerId": "uuid" }
```

**Errors:** `409 ConflictError` if name already taken.

---

### `POST /auth/initiate`

Start the narrative auth challenge for a player.

**Request body:**
```json
{ "playerName": "string" }
```

**Response `200`:**
```json
{
  "challengeId": "uuid",
  "question": "string"
}
```

Internally: picks a random profile field (background | personality | interests), embeds it via OpenRouter, generates a narrative question via LLM, stores `AuthChallenge` in Redis (5min TTL).

---

### `POST /auth/validate`

Validate the player's answer and issue a JWT.

**Request body:**
```json
{
  "challengeId": "uuid",
  "answer": "string"
}
```

**Response `200`:**
```json
{ "token": "jwt-string" }
```

**Errors:** `401 UnauthorizedError` if cosine similarity < 0.6.

---

### `POST /auth/dm`

Authenticate as DM using the password.

**Request body:**
```json
{ "password": "string" }
```

**Response `200`:**
```json
{ "token": "jwt-string" }
```

JWT payload: `{ role: 'DM' }`.

## Data owned

- `players` — id, name, class, race, background, personality, interests, created_at
- `player_embeddings` — player_id, embedding(vector[1536]), drift_alpha, interaction_count
- `auth_challenge:{challengeId}` in Redis (TTL 5min)

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_PORT` | No (default: 3002) | HTTP port |
| `JWT_SECRET` | Yes | Min 32 chars. Must match chat-service and world-service |
| `JWT_EXPIRES_IN` | No (default: 24h) | JWT token lifetime |
| `DM_PASSWORD` | Yes | Min 8 chars |
| `OPENROUTER_API_KEY` | Yes | For embedding and LLM calls |
| `SEMANTIC_AUTH_THRESHOLD` | No (default: 0.6) | Cosine similarity threshold |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `FRONTEND_URL` | Yes | CORS allowed origin |

## Key design decisions

- **[ADR-001](/architecture/decisions#adr-001-narrative-authentication-for-players)**: No passwords for players — cosine similarity on character backstory
- **[ADR-008](/architecture/decisions#adr-008-shared-jwt-secret-across-services)**: Shared `JWT_SECRET` — other services verify tokens locally without calling auth-service
- **[ADR-004](/architecture/decisions#adr-004-apperror-hierarchy)**: `AppError` hierarchy for typed HTTP errors
