# Phase 05 — World Service

**Agent**: `database` + `graphql` (use `database` agent for GraphQL resolver implementations)  
**Depends on**: Phase 02, 03  
**Service**: `services/world-service/` (port 3004)

---

## What you're building

The read-heavy world data service. Exposes a GraphQL API (Mercurius) for all NPC, location, affinity, player, and lore queries. Used by the web frontend and by chat-service for data lookups. DM-protected routes check the JWT role claim.

---

## Directory structure

```
services/world-service/
├── src/
│   ├── application/
│   │   └── use-cases/
│   │       ├── GetCharacterUseCase.ts
│   │       ├── ListCharactersUseCase.ts
│   │       ├── GetLocationUseCase.ts
│   │       ├── ListLocationsUseCase.ts
│   │       ├── GetAffinityUseCase.ts
│   │       ├── ListAffinitiesUseCase.ts
│   │       ├── UpdateAffinityUseCase.ts
│   │       └── ListPlayersUseCase.ts
│   ├── interface/
│   │   └── graphql/
│   │       ├── schema.ts
│   │       ├── resolvers.ts
│   │       └── context.ts
│   ├── interface/http/
│   │   ├── server.ts
│   │   └── errorHandler.ts
│   ├── composition/
│   │   └── container.ts
│   └── index.ts
├── tests/
│   └── integration/
│       └── graphql.test.ts
├── package.json
└── tsconfig.json
```

---

## Packages to install

```bash
npm install fastify @mercuriusjs/mercurius graphql @fastify/jwt \
  @fastify/cors @fastify/helmet zod \
  @valkaria/domain @valkaria/config @valkaria/database \
  -w @valkaria/world-service

npm install -D vitest @types/node -w @valkaria/world-service
```

---

## GraphQL Schema

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

type Mutation {
  updateAffinity(playerName: String!, npcName: String!, score: Float!): AffinityEntry!
}

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
  services: [String!]!
}

type AffinityEntry {
  id: ID!
  playerId: ID!
  npcName: String!
  level: String!
  score: Float!
  interactionCount: Int!
}

type PlayerProfile {
  id: ID!
  name: String!
  class: String!
  race: String!
  background: String!
  personality: String!
  interests: String!
  createdAt: String!
}
```

### `src/interface/graphql/schema.ts`
Define the type definitions string (SDL format) matching the schema above. Export as `typeDefs`.

### `src/interface/graphql/resolvers.ts`
Implement all resolvers. Each resolver calls the corresponding use case. DM-protected resolvers check `context.user?.role === 'DM'` and throw `ForbiddenError` otherwise.

```typescript
export function createResolvers(useCases: { /* all use cases */ }) {
  return {
    Query: {
      npc: async (_, { name }) => useCases.getCharacter.execute(name),
      npcs: async (_, args) => useCases.listCharacters.execute(args),
      players: async (_, args, context) => {
        if (context.user?.role !== 'DM') throw new ForbiddenError('DM only')
        return useCases.listPlayers.execute(args)
      },
      // ... other queries
    },
    Mutation: {
      updateAffinity: async (_, args) => useCases.updateAffinity.execute(args),
    }
  }
}
```

### `src/interface/graphql/context.ts`
Extracts JWT from `Authorization` header, verifies it, attaches `user` to context. Non-authenticated requests get `user: null`.

### `src/interface/http/server.ts`
Register Mercurius with the schema and resolvers. Enable GraphQL playground in development.

```typescript
import mercurius from '@mercuriusjs/mercurius'

await app.register(mercurius, {
  schema: typeDefs,
  resolvers,
  context: (request) => buildContext(request),
  graphiql: process.env.NODE_ENV !== 'production',
})
```

---

## Use case implementations

Each use case calls the repository. Example:

```typescript
// GetCharacterUseCase.ts
export class GetCharacterUseCase {
  constructor(private repo: CharacterRepository) {}
  
  async execute(name: string): Promise<Character | null> {
    return this.repo.findByName(name)
  }
}
```

`UpdateAffinityUseCase` also calls `scoreToLevel()` to update the `level` field whenever the score changes.

---

## Key implementation notes

1. Mercurius handles errors differently from REST Fastify — GraphQL errors are returned as `{ errors: [...] }` with status 200. Only throw `AppError` subclasses in resolvers; Mercurius wraps them in GraphQL error format.
2. The `players` query requires DM role — check `context.user?.role === 'DM'`.
3. Pagination defaults: `page: 1`, `pageSize: 20`.
4. The `npc.location` field resolves the location name from `characters.location_id` via a join query.

---

## Environment variables needed

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/valkaria
WORLD_PORT=3004
JWT_SECRET=change-me-to-32-char-minimum-secret
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=valkaria-neo4j-pass
FRONTEND_URL=http://localhost:3000
```

---

## Acceptance check

```bash
npm run dev -w @valkaria/world-service
```

Run `verify-api` skill — test 5 must pass:
```bash
curl -X POST http://localhost:3004/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ npcs(pageSize: 3) { name faction } }"}'
# → {"data": {"npcs": [...]}}
```

If `characters` table is empty, run the `seed-database` skill first (requires Phase 06 to be complete — for now just verify the endpoint returns an empty array without error).
