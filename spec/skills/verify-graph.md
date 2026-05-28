---
name: verify-graph
description: Test the LangGraph pipeline interactively by sending predefined messages and verifying correct behavior. Use after phase 07, 08, 09, and 10 to confirm each set of nodes works end-to-end.
---

## Purpose
Verify the LangGraph pipeline works correctly by running the interactive REPL and checking responses against expected behavior.

## Prerequisites
- Docker infrastructure running
- Phase 06 (data ingestion) complete — database populated
- Relevant chat-service nodes implemented

## Steps

1. **Start the graph REPL:**
```bash
npm run graph:dev -w @valkaria/chat-service
```
Expected: 
```
ValkáriaGraph Dev REPL
Thread ID: dev-session-001
Type your message (or /exit to quit):
>
```

2. **Send test messages in order:**

### Test 1: Greeting / fallback routing (available after phase 07)
```
> Olá
```
Expected behavior:
- intent: `greeting` or `chat`
- response: Portuguese narrative welcome message
- no stack traces in output
- response arrives in < 30 seconds

### Test 2: Identity flow (available after phase 07)
```
> Sou Nymeria, uma elfa maga
```
Expected behavior:
- intent: `identify_player`
- response: prompts player for auth challenge OR acknowledges identity
- response in Portuguese

### Test 3: NPC query via retrieval (available after phase 08)
```
> Me fale sobre Aaliyah
```
Expected behavior:
- intent: `ask_character`
- simpleRetrievalNode finds Aaliyah in PostgreSQL or vector store
- response: narrative description of Aaliyah (moreau cat, receptionist)
- response mentions at minimum: name, location, personality trait

### Test 4: Relationship/location query via Cypher (available after phase 08)
```
> Quem mora em Candessah?
```
Expected behavior:
- intent: `ask_relationship` or `search_npcs` with location slot
- cypherGenerateNode creates valid Cypher
- cypherExecuteNode runs it against Neo4j
- response: list of NPCs with narrative framing

### Test 5: Affinity query (available after phase 09)
```
> Qual minha afinidade com Aaliyah?
```
Expected behavior:
- intent: `ask_affinity`
- affinityNode loads affinity snapshot
- response: narrative description of the relationship level

### Test 6: NPC recommendation (available after phase 09)
```
> Recomende-me um NPC para conhecer
```
Expected behavior:
- intent: `recommend_npcs` or `ask_recommendation`
- recommendationNode returns 3 NPCs
- response: narrative recommendation of 3 NPCs with brief descriptions

3. **Check for:**
   - All responses in Brazilian Portuguese
   - No English phrases slipping through
   - No raw JSON in responses
   - No stack traces or error objects in output
   - Response latency < 30 seconds per turn

4. **Exit:**
```
> /exit
```

## Report format

```
Graph Verification: chat-service
  ✓ Test 1: Greeting routing — Portuguese response, intent: chat
  ✓ Test 2: Identity flow — challenged player, intent: identify_player  
  ✓ Test 3: NPC query — Aaliyah found, Casa de Banho mentioned
  ✗ Test 4: Cypher query — stack trace: neo4j connection refused
  - Test 5: Skipped (depends on test 4)
  - Test 6: Skipped (depends on test 4)
  
  Failure detail: Test 4
    Neo4j connection refused: check NEO4J_URI in .env
    Expected: bolt://localhost:7687 when running locally
```

## Notes
- The REPL uses a fixed `thread_id: dev-session-001` so state persists between runs in the same session. Start fresh for clean tests.
- If LLM calls fail with 429 (rate limit), wait 60 seconds and retry.
- The free OpenRouter models (Mistral 7B) can be slow — 15-25 seconds per turn is normal.
