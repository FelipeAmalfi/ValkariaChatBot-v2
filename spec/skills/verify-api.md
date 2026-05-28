---
name: verify-api
description: Smoke test all service HTTP endpoints to verify they respond correctly. Use after phases 04, 05, 10, and 11 (gateway) to confirm services are healthy.
---

## Purpose
Send HTTP smoke tests to each service endpoint and verify responses match expected shapes. Run with curl — no external tools needed.

## Prerequisites
- All relevant services running (via `npm run dev` or `docker compose up`)
- Without gateway (phases 04-10): use service ports directly (3002, 3003, 3004)
- With gateway (phase 11+): use port 80

## Test Suite

Set the base URL before running:
```bash
# Before gateway (phases 04-10):
AUTH_URL=http://localhost:3002
CHAT_URL=http://localhost:3003
WORLD_URL=http://localhost:3004

# After gateway (phase 11+):
AUTH_URL=http://localhost:80/auth
CHAT_URL=http://localhost:80/chat
WORLD_URL=http://localhost:80/graphql
```

### Test 1: Auth Service Health
```bash
curl -s $AUTH_URL/health
```
Expected:
```json
{"status": "ok", "uptime": <number>, "version": "0.1.0"}
```

### Test 2: Register a Test Player
```bash
curl -s -X POST $AUTH_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestPlayer_verify",
    "class": "Warrior",
    "race": "Human",
    "background": "A seasoned warrior who fought in many battles across the northern plains.",
    "personality": "Direct and honorable, never backs down from a challenge.",
    "interests": "combat, honor, ancient weapons, military history"
  }'
```
Expected: `201` with body containing `{ "id": "<uuid>", "name": "TestPlayer_verify" }`

### Test 3: Initiate Auth Challenge
```bash
curl -s -X POST "$AUTH_URL/auth/initiate" \
  -H "Content-Type: application/json" \
  -d '{"playerName": "TestPlayer_verify"}'
```
Expected: `200` with body containing `{ "challengeId": "<uuid>", "question": "<narrative question>" }`

Save `challengeId` for test 4.

### Test 4: Chat Message
```bash
curl -s -X POST $CHAT_URL/chat \
  -H "Content-Type: application/json" \
  -H "x-thread-id: verify-test-001" \
  -d '{"message": "Olá, me fale sobre Candessah"}'
```
Expected: `200` with body containing `{ "response": "<portuguese narrative text>" }`

Note: chat-service does NOT require JWT for `guest` role messages — it works without auth for basic chat.

### Test 5: GraphQL NPC Query
```bash
curl -s -X POST $WORLD_URL \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ npcs(pageSize: 3) { name faction role } }"
  }'
```
Expected: `200` with body containing:
```json
{
  "data": {
    "npcs": [
      { "name": "<string>", "faction": "<string>", "role": "<string>" }
    ]
  }
}
```

### Test 6: World Service Health
```bash
curl -s $WORLD_URL/health 2>/dev/null || curl -s http://localhost:3004/health
```
Expected: `200` with `{"status": "ok"}`

## Report format

```
API Verification
  ✓ Test 1: Auth health — 200 ok
  ✓ Test 2: Register player — 201 {id, name}
  ✓ Test 3: Auth challenge — 200 {challengeId, question}
  ✓ Test 4: Chat message — 200, Portuguese response received
  ✗ Test 5: GraphQL NPC query — 500 "relation characters does not exist"
  ✗ Test 6: World health — connection refused

Failure details:
  Test 5: Database table 'characters' not found. Run migrations first:
    npm run migrate -w @valkaria/database
  Test 6: world-service not running. Start with:
    npm run dev -w @valkaria/world-service
```

## Gateway-specific tests (phase 11+)

After gateway is running, verify routing works:

```bash
# Should route to auth-service
curl -s http://localhost:80/auth/health

# Should route to chat-service  
curl -s -X POST http://localhost:80/chat \
  -H "Content-Type: application/json" \
  -H "x-thread-id: gw-test" \
  -d '{"message": "Olá"}'

# Should route to world-service GraphQL
curl -s -X POST http://localhost:80/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ npcs(pageSize: 1) { name } }"}'
```

Also verify `X-Request-ID` header is injected:
```bash
curl -sv http://localhost:80/auth/health 2>&1 | grep -i "x-request-id"
```
Expected: `< X-Request-ID: <uuid>`
