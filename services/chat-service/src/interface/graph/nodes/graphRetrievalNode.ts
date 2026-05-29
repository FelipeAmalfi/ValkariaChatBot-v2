import type { ValkáriaState } from '../state.js'
import type { GraphDependencies } from '../dependencies.js'

export async function graphRetrievalNode(
  state: ValkáriaState,
  deps: GraphDependencies,
): Promise<Partial<ValkáriaState>> {
  const session = deps.neo4jDriver.session()
  const lines: string[] = []

  try {
    const { slots } = state

    if (slots.locationName) {
      const result = await session.run(
        'MATCH (n:NPC)-[:LOCATED_IN]->(l:Location) WHERE toLower(l.name) = toLower($location) RETURN n.name AS name, n.faction AS faction',
        { location: String(slots.locationName) },
      )
      const npcs = result.records
        .map(r => `${String(r.get('name'))} (${String(r.get('faction') ?? 'sem facção')})`)
        .join(', ')
      if (npcs) lines.push(`NPCs em ${slots.locationName}: ${npcs}`)
    }

    if (slots.characterName) {
      const result = await session.run(
        'MATCH (n:NPC)-[:LIKES]->(i:Interest) WHERE toLower(n.name) = toLower($name) RETURN i.name AS interest',
        { name: String(slots.characterName) },
      )
      const interests = result.records.map(r => String(r.get('interest'))).join(', ')
      if (interests) lines.push(`Interesses de ${slots.characterName}: ${interests}`)
    }

    return { graphContext: lines.length ? lines.join('\n') : undefined }
  } catch {
    return { graphContext: undefined }
  } finally {
    await session.close()
  }
}
