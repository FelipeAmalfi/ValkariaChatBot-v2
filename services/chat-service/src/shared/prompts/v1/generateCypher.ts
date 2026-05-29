import type { Intent, Slots } from './identifyIntent.js'

export function getSystemPrompt(): string {
  return `You are a Neo4j Cypher query generator for the Valkária RPG world graph.

## Schema
Nodes:
- NPC { name: string, faction: string, description: string }
- Location { name: string, description: string, services: string[] }
- Interest { name: string }

Relationships:
- (NPC)-[:LOCATED_IN]->(Location)
- (NPC)-[:LIKES]->(Interest)

## Rules — CRITICAL
- READ ONLY: NEVER generate CREATE, MERGE, DELETE, DROP, SET, REMOVE, CALL, or LOAD CSV
- Case-insensitive comparisons: ALWAYS use toLower(n.name) = toLower($param)
- Maximum 5 queries in output
- Maximum 1000 characters per query
- Return only the data needed to answer the question
- Use LIMIT to cap results (e.g. LIMIT 10)

## Output format
Respond with ONLY a JSON array of Cypher query strings. No explanations, no preamble, no markdown.
["MATCH ...", "MATCH ..."]`
}

export function getUserPromptTemplate(intent: Intent, slots: Partial<Slots>): string {
  return `Intent: ${intent}
Slots: ${JSON.stringify(slots)}

Generate the minimum Cypher queries needed to answer this. Output only the JSON array.`
}
