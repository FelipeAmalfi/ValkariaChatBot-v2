import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { CsvParser } from '../../src/parsers/CsvParser.js'

const LOCATIONS_CSV = `name;description;services
Valkarith;Capital city;blacksmithing,tavern
Thornwood;Forest village;herbalism,hunting`

const NPCS_CSV = `name;description;location;likes;dislikes;benefits_cordial;benefits_loyal;benefits_intimate;last_demand
Morrigan;An archivist;Valkarith;knowledge,silence;noise;Archive access;Restricted tomes;Hidden vault;Find the missing tome
Drak;A captain;Thornwood;honor;cowardice;Information;Maps;Recommendation;Patrol the border`

describe('CsvParser', () => {
  let locFile: string
  let npcFile: string
  const parser = new CsvParser()

  beforeAll(() => {
    locFile = join(tmpdir(), 'test-locations.csv')
    npcFile = join(tmpdir(), 'test-npcs.csv')
    writeFileSync(locFile, LOCATIONS_CSV)
    writeFileSync(npcFile, NPCS_CSV)
  })

  afterAll(() => {
    unlinkSync(locFile)
    unlinkSync(npcFile)
  })

  it('parses locations from CSV', () => {
    const rows = parser.parseLocations(locFile)
    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe('Valkarith')
    expect(rows[0].description).toBe('Capital city')
    expect(rows[0].services).toBe('blacksmithing,tavern')
  })

  it('parses NPCs from CSV', () => {
    const rows = parser.parseNpcs(npcFile)
    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe('Morrigan')
    expect(rows[0].location).toBe('Valkarith')
    expect(rows[0].likes).toBe('knowledge,silence')
    expect(rows[0].dislikes).toBe('noise')
  })

  it('trims whitespace from fields', () => {
    const content = 'name;description;services\n  Shadowfen ;  Swamp  ;  alchemy  '
    const tmpFile = join(tmpdir(), 'test-trim.csv')
    writeFileSync(tmpFile, content)
    const rows = parser.parseLocations(tmpFile)
    expect(rows[0].name).toBe('Shadowfen')
    expect(rows[0].description).toBe('Swamp')
    unlinkSync(tmpFile)
  })
})
