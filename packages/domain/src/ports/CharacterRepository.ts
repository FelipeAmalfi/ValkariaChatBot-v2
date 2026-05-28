import type { Character } from '../entities/Character.js'

export interface CharacterRepository {
  findByName(name: string): Promise<Character | null>
  findMany(filters?: {
    location?: string
    faction?: string
    role?: string
    page?: number
    pageSize?: number
  }): Promise<Character[]>
  upsert(character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character>
}
