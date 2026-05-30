import { describe, it, expect } from 'vitest'
import { isSafeCypher } from '../../src/interface/graph/nodes/cypherExecuteNode.js'

describe('isSafeCypher', () => {
  it.each([
    'MATCH (n:NPC) RETURN n',
    'MATCH (n:NPC {name: "Aaliyah"}) RETURN n.name',
    'MATCH (n)-[:LOCATED_IN]->(l) RETURN n, l',
  ])('allows safe query: %s', (query) => {
    expect(isSafeCypher(query)).toBe(true)
  })

  it.each([
    'CREATE (n:NPC {name: "Hacker"})',
    'MERGE (n:NPC {name: "Hacker"})',
    'DELETE n',
    'DROP INDEX idx_npc',
    'MATCH (n) SET n.name = "hacked"',
    'CALL db.clearQueryCaches()',
  ])('rejects unsafe query: %s', (query) => {
    expect(isSafeCypher(query)).toBe(false)
  })
})
