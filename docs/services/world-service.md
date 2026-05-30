# world-service

**Port**: 3004 | **Package**: `@valkaria/world-service`

## Responsibilities

Read-heavy world data service. Exposes a GraphQL API (Mercurius) for all NPC, location, affinity, player, and lore queries.

- 7 queries: `npc`, `npcs`, `location`, `locations`, `affinity`, `affinities`, `players` (DM only)
- 5 mutations: `registerPlayer`, `initiatePlayerAuth`, `verifyPlayerAuth`, `authenticateDM`, `updateAffinity`
- DM-only guard on `players` query via JWT role claim
- Used by the web frontend (Apollo Client) and by chat-service for data lookups

## GraphQL Schema

### Queries

```graphql
type Query {
  npc(name: String!): Npc
  npcs(location: String, faction: String, page: Int, pageSize: Int): [Npc!]!
  location(name: String!): Location
  locations(page: Int, pageSize: Int): [Location!]!
  affinity(playerName: String!, npcName: String!): AffinityEntry
  affinities(playerName: String!): [AffinityEntry!]!
  players(page: Int, pageSize: Int): [PlayerProfile!]!  # DM only
}
```

### Mutations

```graphql
type Mutation {
  updateAffinity(playerName: String!, npcName: String!, score: Float!): AffinityEntry!
}
```

Auth mutations (`registerPlayer`, `initiatePlayerAuth`, `verifyPlayerAuth`, `authenticateDM`) are proxied to auth-service internally, or can be called directly — the gateway handles routing.

### Types

```graphql
type Npc {
  id: ID!
  name: String!
  description: String
  role: String!
  faction: String!
  location: String
  metadata: NpcMetadata
}

type NpcMetadata {
  likes: [String!]
  dislikes: [String!]
  benefitsCordial: String
  benefitsLoyal: String
  benefitsIntimate: String
  lastDemand: String
}

type Location {
  id: ID!
  name: String!
  description: String
  services: [String!]
}

type AffinityEntry {
  playerName: String!
  npcName: String!
  level: AffinityLevel!
  score: Int!
  interactionCount: Int!
}

enum AffinityLevel { none cordial loyal intimate }

type PlayerProfile {
  id: ID!
  name: String!
  class: String!
  race: String!
}
```

## Data owned

- `characters` — NPC records (id, name, description, role, faction, location_id, metadata JSONB)
- `locations` — location records (id, name, description, services)
- `npc_affinity` — player-NPC affinity scores and levels
- `interaction_history` — per-turn interaction logs
- `recommendation_feedback` — player feedback on NPC recommendations
- `langchain_pg_embedding` — vector embeddings for similarity search

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `WORLD_PORT` | No (default: 3004) | HTTP port |
| `JWT_SECRET` | Yes | Must match auth-service |
| `NEO4J_URI` | Yes | Neo4j Bolt connection string |
| `NEO4J_USER` | Yes | Neo4j username |
| `NEO4J_PASSWORD` | Yes | Neo4j password |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `FRONTEND_URL` | Yes | CORS allowed origin |

## Key design decisions

- **[ADR-008](/architecture/decisions#adr-008-shared-jwt-secret-across-services)**: JWT verification is local — no auth-service roundtrip
- **[ADR-005](/architecture/decisions#adr-005-affinity-level-mapping)**: Affinity stored as 0–100 score, mapped to named levels for UI
- Mercurius over Apollo Server: native Fastify integration, ~30% faster
