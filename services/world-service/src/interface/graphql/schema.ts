export const typeDefs = `
  type Query {
    npc(name: String!): Npc
    npcs(location: String, faction: String, page: Int, pageSize: Int): [Npc!]!
    location(name: String!): Location
    locations(page: Int, pageSize: Int): [Location!]!
    affinity(playerName: String!, npcName: String!): AffinityEntry
    affinities(playerName: String!): [AffinityEntry!]!
    players(page: Int, pageSize: Int): [PlayerProfile!]!
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
`
