import { ForbiddenError } from '@valkaria/domain'
import type { LocationRepository } from '@valkaria/domain'
import type { Character } from '@valkaria/domain'
import type { MercuriusContext } from 'mercurius'
import type { GetCharacterUseCase } from '../../application/use-cases/GetCharacterUseCase.js'
import type { ListCharactersUseCase } from '../../application/use-cases/ListCharactersUseCase.js'
import type { GetLocationUseCase } from '../../application/use-cases/GetLocationUseCase.js'
import type { ListLocationsUseCase } from '../../application/use-cases/ListLocationsUseCase.js'
import type { GetAffinityUseCase } from '../../application/use-cases/GetAffinityUseCase.js'
import type { ListAffinitiesUseCase } from '../../application/use-cases/ListAffinitiesUseCase.js'
import type { UpdateAffinityUseCase } from '../../application/use-cases/UpdateAffinityUseCase.js'
import type { SetAffinityUseCase } from '../../application/use-cases/SetAffinityUseCase.js'
import type { ListPlayersUseCase } from '../../application/use-cases/ListPlayersUseCase.js'
import './context.js'

interface UseCases {
  getCharacter: GetCharacterUseCase
  listCharacters: ListCharactersUseCase
  getLocation: GetLocationUseCase
  listLocations: ListLocationsUseCase
  getAffinity: GetAffinityUseCase
  listAffinities: ListAffinitiesUseCase
  updateAffinity: UpdateAffinityUseCase
  setAffinity: SetAffinityUseCase
  listPlayers: ListPlayersUseCase
  locationRepo: LocationRepository
}

export function createResolvers(useCases: UseCases) {
  return {
    Query: {
      npc: (_: unknown, { name }: { name: string }) =>
        useCases.getCharacter.execute(name),

      npcs: (_: unknown, args: { location?: string; page?: number; pageSize?: number }) =>
        useCases.listCharacters.execute(args),

      location: (_: unknown, { name }: { name: string }) =>
        useCases.getLocation.execute(name),

      locations: (_: unknown, args: { page?: number; pageSize?: number }) =>
        useCases.listLocations.execute(args),

      affinity: (_: unknown, args: { playerName: string; npcName: string }) =>
        useCases.getAffinity.execute(args),

      affinities: (_: unknown, { playerName }: { playerName: string }) =>
        useCases.listAffinities.execute(playerName),

      players: async (_: unknown, args: { page?: number; pageSize?: number }, ctx: MercuriusContext) => {
        if (ctx.user?.role !== 'DM') throw new ForbiddenError('DM only')
        return useCases.listPlayers.execute(args)
      },
    },

    Mutation: {
      updateAffinity: (_: unknown, args: { playerName: string; npcName: string; score: number }) =>
        useCases.updateAffinity.execute(args),
      setAffinity: (_: unknown, args: { playerName: string; npcName: string; score: number }) =>
        useCases.setAffinity.execute(args),
    },

    Npc: {
      location: async (npc: Character) => {
        if (!npc.locationId) return null
        const loc = await useCases.locationRepo.findById(npc.locationId)
        return loc?.name ?? null
      },
      metadata: (npc: Character) => {
        const m = npc.metadata
        if (!m) return null
        return {
          likes: m.likes ?? null,
          dislikes: m.dislikes ?? null,
          benefitsCordial: m.benefits_cordial ?? null,
          benefitsLoyal: m.benefits_loyal ?? null,
          benefitsIntimate: m.benefits_intimate ?? null,
          lastDemand: m.last_demand ?? null,
        }
      },
    },
  }
}
