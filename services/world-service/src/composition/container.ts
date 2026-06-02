import {
  getPgPool,
  PgCharacterRepository,
  PgPlayerRepository,
  PgAffinityRepository,
  PgLocationRepository,
} from '@valkaria/database'
import type { Pool } from 'pg'
import { GetCharacterUseCase } from '../application/use-cases/GetCharacterUseCase.js'
import { ListCharactersUseCase } from '../application/use-cases/ListCharactersUseCase.js'
import { GetLocationUseCase } from '../application/use-cases/GetLocationUseCase.js'
import { ListLocationsUseCase } from '../application/use-cases/ListLocationsUseCase.js'
import { GetAffinityUseCase } from '../application/use-cases/GetAffinityUseCase.js'
import { ListAffinitiesUseCase } from '../application/use-cases/ListAffinitiesUseCase.js'
import { UpdateAffinityUseCase } from '../application/use-cases/UpdateAffinityUseCase.js'
import { SetAffinityUseCase } from '../application/use-cases/SetAffinityUseCase.js'
import { ListPlayersUseCase } from '../application/use-cases/ListPlayersUseCase.js'

interface Env {
  DATABASE_URL: string
}

export interface ContainerDeps {
  getCharacter: GetCharacterUseCase
  listCharacters: ListCharactersUseCase
  getLocation: GetLocationUseCase
  listLocations: ListLocationsUseCase
  getAffinity: GetAffinityUseCase
  listAffinities: ListAffinitiesUseCase
  updateAffinity: UpdateAffinityUseCase
  listPlayers: ListPlayersUseCase
  setAffinity: SetAffinityUseCase
  locationRepo: PgLocationRepository
}

export interface WorldBuildResult {
  deps: ContainerDeps
  pool: Pool
}

export function buildContainer(env: Env): WorldBuildResult {
  const pool = getPgPool(env.DATABASE_URL)

  const characterRepo = new PgCharacterRepository(pool)
  const playerRepo = new PgPlayerRepository(pool)
  const affinityRepo = new PgAffinityRepository(pool)
  const locationRepo = new PgLocationRepository(pool)

  return {
    deps: {
      getCharacter: new GetCharacterUseCase(characterRepo),
      listCharacters: new ListCharactersUseCase(characterRepo),
      getLocation: new GetLocationUseCase(locationRepo),
      listLocations: new ListLocationsUseCase(locationRepo),
      getAffinity: new GetAffinityUseCase(affinityRepo, playerRepo),
      listAffinities: new ListAffinitiesUseCase(affinityRepo, playerRepo),
      updateAffinity: new UpdateAffinityUseCase(affinityRepo, playerRepo),
      listPlayers: new ListPlayersUseCase(playerRepo),
      setAffinity: new SetAffinityUseCase(affinityRepo, playerRepo),
      locationRepo,
    },
    pool,
  }
}
