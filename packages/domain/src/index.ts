// Entities
export type { Character, CharacterRole, CharacterFaction, CharacterMetadata } from './entities/Character.js'
export type { Player } from './entities/Player.js'
export type { AffinityEntry, AffinitySnapshot } from './entities/AffinityEntry.js'
export type { Location } from './entities/Location.js'
export type { SessionContext } from './entities/SessionContext.js'
export type { AuthChallenge } from './entities/AuthChallenge.js'
export type { RetrievedDocument } from './entities/RetrievedDocument.js'

// Errors
export {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InfrastructureError,
  RepositoryError,
  AIProviderError,
} from './errors/AppError.js'

// Value objects
export type { AffinityLevel } from './value-objects/AffinityLevel.js'
export { scoreToLevel } from './value-objects/AffinityLevel.js'
export type { PlayerRole } from './value-objects/Role.js'

// Ports
export type { AIProvider, AITask, ChatMessage } from './ports/AIProvider.js'
export type { CharacterRepository } from './ports/CharacterRepository.js'
export type { PlayerRepository } from './ports/PlayerRepository.js'
export type { AffinityRepository } from './ports/AffinityRepository.js'
export type { LocationRepository } from './ports/LocationRepository.js'
export type { SessionStore } from './ports/SessionStore.js'
export type { MemoryEngine } from './ports/MemoryEngine.js'
export type { VectorRetriever } from './ports/VectorRetriever.js'
export type { LoreQueryService } from './ports/LoreQueryService.js'
export type { AuthChallengeStore } from './ports/AuthChallengeStore.js'
