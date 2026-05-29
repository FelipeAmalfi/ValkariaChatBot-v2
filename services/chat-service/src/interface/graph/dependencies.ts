import type {
  CharacterRepository,
  PlayerRepository,
  AffinityRepository,
  LocationRepository,
  SessionStore,
  MemoryEngine,
  VectorRetriever,
  LoreQueryService,
  AIProvider,
} from '@valkaria/domain'
import type { Driver } from 'neo4j-driver'

export interface GraphDependencies {
  characterRepository: CharacterRepository
  playerRepository: PlayerRepository
  affinityRepository: AffinityRepository
  locationRepository: LocationRepository
  vectorRetriever: VectorRetriever
  loreQueryService: LoreQueryService
  sessionStore: SessionStore
  memoryEngine: MemoryEngine
  neo4jDriver: Driver
  aiProvider: AIProvider
}
