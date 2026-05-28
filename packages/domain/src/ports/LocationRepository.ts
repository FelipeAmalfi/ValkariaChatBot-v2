import type { Location } from '../entities/Location.js'

export interface LocationRepository {
  findByName(name: string): Promise<Location | null>
  findMany(filters?: {
    page?: number
    pageSize?: number
  }): Promise<Location[]>
  upsert(location: Omit<Location, 'id' | 'createdAt'>): Promise<Location>
}
