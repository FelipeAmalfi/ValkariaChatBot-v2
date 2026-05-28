import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { errorHandler } from './errorHandler.js'
import { AuthController } from './controllers/AuthController.js'
import type { AuthControllerDeps } from './controllers/AuthController.js'

export async function createServer(deps: AuthControllerDeps) {
  const app = Fastify({ logger: false })

  await app.register(helmet)
  await app.register(cors, { origin: process.env.FRONTEND_URL })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })

  app.setErrorHandler(errorHandler)

  app.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    version: '0.1.0',
  }))

  const controller = new AuthController(deps)
  controller.register(app)

  return app
}
