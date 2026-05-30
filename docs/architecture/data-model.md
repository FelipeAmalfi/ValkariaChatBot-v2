# Data Model

All persistent state across ValkáriaV2. Three databases: PostgreSQL (relational + vectors), Redis (ephemeral cache), Neo4j (graph relationships).

## PostgreSQL

All services share one database, with separate table ownership per service.

### auth-service owns

**`players`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | unique |
| class | text | |
| race | text | |
| background | text | |
| personality | text | |
| interests | text | |
| created_at | timestamptz | |

**`player_embeddings`**
| Column | Type | Notes |
|---|---|---|
| player_id | uuid (FK → players) | |
| embedding | vector(1536) | pgvector |
| drift_alpha | float | |
| interaction_count | int | |

### world-service owns

**`characters`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| description | text | |
| role | text | |
| faction | text | |
| location_id | uuid (FK → locations) | |
| metadata | JSONB | benefits_cordial, benefits_loyal, benefits_intimate, likes, dislikes, last_demand |

**`locations`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| description | text | |
| services | text[] | |

**`npc_affinity`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| player_id | uuid | |
| npc_name | text | |
| level | enum | none \| cordial \| loyal \| intimate |
| score | int | 0–100 |
| interaction_count | int | |

**`interaction_history`**
| Column | Type | Notes |
|---|---|---|
| player_id | uuid | |
| npc_name | text | |
| location_name | text | |
| intent | text | |
| sentiment | text | |
| message_summary | text | |

**`recommendation_feedback`**
| Column | Type | Notes |
|---|---|---|
| player_id | uuid | |
| npc_name | text | |
| helpful | bool | |
| created_at | timestamptz | |

**`langchain_pg_embedding`**
| Column | Type | Notes |
|---|---|---|
| uuid | uuid (PK) | |
| collection_id | uuid | |
| embedding | vector(1536) | |
| document | text | |
| cmetadata | JSONB | |

### chat-service owns

**`memory_summaries`**
| Column | Type | Notes |
|---|---|---|
| thread_id | text (PK) | |
| player_id | uuid | |
| summary | text | |
| turn_count | int | |
| updated_at | timestamptz | |

**`checkpoints`** (auto-managed by PostgresSaver)
Managed by `@langchain/langgraph-checkpoint-postgres`. Do not write to this table directly.

## Redis (namespaced keys)

| Key pattern | Value | TTL | Owner |
|---|---|---|---|
| `session:{threadId}` | `SessionContext` JSON | 24h | chat-service |
| `auth_challenge:{challengeId}` | `AuthChallenge` JSON | 5min | auth-service |
| `rate_limit:*` | nginx-managed | per-window | nginx |

**SessionContext** (stored at `session:{threadId}`):
```typescript
{
  role: 'PLAYER' | 'DM'
  playerName: string
  affinitySnapshot: Record<string, number>
  recentMessages: Array<{ role: string; content: string }>
}
```

**AuthChallenge** (stored at `auth_challenge:{challengeId}`):
```typescript
{
  challengeId: string
  playerName: string
  fieldEmbedding: number[]  // 1536-dim
  fieldName: 'background' | 'personality' | 'interests'
}
```

## Neo4j

Graph database for NPC relationship queries and Cypher generation.

**Nodes:**
- `:NPC { name, faction, role }`
- `:Location { name }`
- `:Interest { name }`

**Relationships:**
- `(NPC)-[:LOCATED_IN]->(Location)`
- `(NPC)-[:LIKES]->(Interest)`

**Used by:**
- chat-service: Cypher generation node queries NPC relationships for context
- world-service: relationship queries for affinity-aware NPC recommendations

**Populated by:** `ingestion-worker` (CSV → Neo4j stage). ~900 NPCs, ~100 locations, interests extracted from NPC profiles.

## Affinity Level Mapping

Numeric score → named level (see [ADR-005](/architecture/decisions#adr-005-affinity-level-mapping)):

| Score | Level | Benefits unlocked |
|---|---|---|
| 0 | none | — |
| 1–25 | cordial | `benefits_cordial` |
| 26–75 | loyal | `benefits_loyal` |
| 76–100 | intimate | `benefits_intimate` |
