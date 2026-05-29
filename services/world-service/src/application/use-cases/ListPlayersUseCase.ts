import type { PlayerRepository, Player } from '@valkaria/domain'

interface Filters {
  page?: number
  pageSize?: number
}

export class ListPlayersUseCase {
  constructor(private repo: PlayerRepository) {}

  async execute(filters?: Filters): Promise<Player[]> {
    return this.repo.findMany({
      page: filters?.page ?? 1,
      pageSize: filters?.pageSize ?? 20,
    })
  }
}
