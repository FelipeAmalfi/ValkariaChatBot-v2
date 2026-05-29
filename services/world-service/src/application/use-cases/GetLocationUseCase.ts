import type { LocationRepository, Location } from '@valkaria/domain'

export class GetLocationUseCase {
  constructor(private repo: LocationRepository) {}

  async execute(name: string): Promise<Location | null> {
    return this.repo.findByName(name)
  }
}
