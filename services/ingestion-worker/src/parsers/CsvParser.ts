import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'

export interface NpcRow {
  name: string
  description: string
  location: string
  likes: string      // comma-separated
  dislikes: string   // comma-separated
  benefits_cordial: string
  benefits_loyal: string
  benefits_intimate: string
  last_demand: string
}

export interface LocationRow {
  name: string
  description: string
  services: string   // comma-separated
}

export class CsvParser {
  parseNpcs(filePath: string): NpcRow[] {
    const content = readFileSync(filePath, 'utf-8')
    return parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as NpcRow[]
  }

  parseLocations(filePath: string): LocationRow[] {
    const content = readFileSync(filePath, 'utf-8')
    return parse(content, {
      delimiter: ';',
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as LocationRow[]
  }
}
