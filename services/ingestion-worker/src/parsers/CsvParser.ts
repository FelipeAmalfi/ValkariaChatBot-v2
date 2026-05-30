import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

export interface NpcRow {
  name: string
  description: string
  location: string
  likes: string
  dislikes: string
  benefits_cordial: string
  benefits_loyal: string
  benefits_intimate: string
  last_demand: string
}

export interface LocationRow {
  name: string
  short_description: string
  full_description: string
  services: string
  honors: string
  npcs: string
}

export class CsvParser {
  parseNpcs(filePath: string): NpcRow[] {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    // Skip header line
    // Fields after description (fixed, no semicolons inside):
    // location, likes, dislikes, benefits_cordial, benefits_loyal, benefits_intimate, last_demand = 7 fields
    return lines.slice(1).map(line => {
      const parts = line.split(';')
      const name = parts[0]!.trim()
      const last_demand = parts[parts.length - 1]!.trim()
      const benefits_intimate = parts[parts.length - 2]!.trim()
      const benefits_loyal = parts[parts.length - 3]!.trim()
      const benefits_cordial = parts[parts.length - 4]!.trim()
      const dislikes = parts[parts.length - 5]!.trim()
      const likes = parts[parts.length - 6]!.trim()
      const location = parts[parts.length - 7]!.trim()
      const description = parts.slice(1, parts.length - 7).join(';').trim()
      return { name, description, location, likes, dislikes, benefits_cordial, benefits_loyal, benefits_intimate, last_demand }
    })
  }

  parseLocations(filePath: string): LocationRow[] {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    // Skip header line
    return lines.slice(1).map(line => {
      const parts = line.split(';')
      // Last 3 fields are services, honors, npcs (no semicolons inside)
      // First 2 are name, short_description
      // Everything in between is full_description (may contain semicolons)
      const name = parts[0]!.trim()
      const short_description = parts[1]!.trim()
      const npcs = parts[parts.length - 1]!.trim()
      const honors = parts[parts.length - 2]!.trim()
      const services = parts[parts.length - 3]!.trim()
      const full_description = parts.slice(2, parts.length - 3).join(';').trim()
      return { name, short_description, full_description, services, honors, npcs }
    })
  }
}

export function normalizeLocationName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}
