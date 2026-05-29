import type { CharacterRepository, Character } from '@valkaria/domain'

interface Filters {
  location?: string
  faction?: string
  page?: number
  pageSize?: number
}

export class ListCharactersUseCase {
  constructor(private repo: CharacterRepository) {}

  async execute(filters?: Filters): Promise<Character[]> {
    return this.repo.findMany({
      location: filters?.location ?? undefined,
      faction: filters?.faction ?? undefined,
      page: filters?.page ?? 1,
      pageSize: filters?.pageSize ?? 20,
    })
  }
}
