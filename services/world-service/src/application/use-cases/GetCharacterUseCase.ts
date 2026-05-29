import type { CharacterRepository, Character } from '@valkaria/domain'

export class GetCharacterUseCase {
  constructor(private repo: CharacterRepository) {}

  async execute(name: string): Promise<Character | null> {
    return this.repo.findByName(name)
  }
}
