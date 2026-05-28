import type { Player } from '../entities/Player.js'

export interface PlayerRepository {
  findByName(name: string): Promise<Player | null>
  findById(id: string): Promise<Player | null>
  create(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player>
  update(id: string, partial: Partial<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Player>
}
