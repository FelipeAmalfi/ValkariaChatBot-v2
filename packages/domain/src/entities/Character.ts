export type CharacterRole = 'npc' | 'merchant' | 'quest_giver' | 'enemy' | 'ally' | 'neutral'
export type CharacterFaction = 'valkaria_order' | 'shadow_guild' | 'merchant_league' | 'free_cities' | 'neutral'

export interface CharacterMetadata {
  likes?: string[]
  dislikes?: string[]
  benefits_cordial?: string
  benefits_loyal?: string
  benefits_intimate?: string
  last_demand?: string
}

export interface Character {
  id: string
  name: string
  description: string | null
  role: CharacterRole
  faction: CharacterFaction | string
  locationId: string | null
  metadata: CharacterMetadata
  createdAt: string
  updatedAt: string
}
