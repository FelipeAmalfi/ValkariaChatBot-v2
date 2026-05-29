import type { LocationRepository, Location } from '@valkaria/domain'

interface Filters {
  page?: number
  pageSize?: number
}

export class ListLocationsUseCase {
  constructor(private repo: LocationRepository) {}

  async execute(filters?: Filters): Promise<Location[]> {
    return this.repo.findMany({
      page: filters?.page ?? 1,
      pageSize: filters?.pageSize ?? 20,
    })
  }
}
