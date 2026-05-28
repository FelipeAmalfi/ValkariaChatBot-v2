import type { FastifyInstance } from 'fastify'
import { ValidationError } from '@valkaria/domain'
import {
  registerSchema,
  initiateSchema,
  validateSchema,
  dmAuthSchema,
} from '../schemas/authSchemas.js'
import type { RegisterPlayerUseCase } from '../../../application/use-cases/RegisterPlayerUseCase.js'
import type { InitiatePlayerAuthUseCase } from '../../../application/use-cases/InitiatePlayerAuthUseCase.js'
import type { ValidatePlayerAuthUseCase } from '../../../application/use-cases/ValidatePlayerAuthUseCase.js'
import type { AuthenticateDMUseCase } from '../../../application/use-cases/AuthenticateDMUseCase.js'

export interface AuthControllerDeps {
  registerPlayer: RegisterPlayerUseCase
  initiatePlayerAuth: InitiatePlayerAuthUseCase
  validatePlayerAuth: ValidatePlayerAuthUseCase
  authenticateDM: AuthenticateDMUseCase
}

export class AuthController {
  constructor(private deps: AuthControllerDeps) {}

  register(app: FastifyInstance): void {
    app.post('/auth/register', async (request, reply) => {
      const result = registerSchema.safeParse(request.body)
      if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input')
      const player = await this.deps.registerPlayer.execute(result.data)
      return reply.status(201).send(player)
    })

    app.post('/auth/initiate', async (request) => {
      const result = initiateSchema.safeParse(request.body)
      if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input')
      return this.deps.initiatePlayerAuth.execute(result.data.playerName)
    })

    app.post('/auth/validate', async (request) => {
      const result = validateSchema.safeParse(request.body)
      if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input')
      return this.deps.validatePlayerAuth.execute(result.data.challengeId, result.data.answer)
    })

    app.post('/auth/dm', async (request) => {
      const result = dmAuthSchema.safeParse(request.body)
      if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid input')
      return this.deps.authenticateDM.execute(result.data.password)
    })
  }
}
