import Fastify, { type FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import type { Pool } from 'pg'
import type Redis from 'ioredis'
import { createLogger } from '@valkaria/config'
import { requestLoggerPlugin } from './plugins/requestLogger.js'
import { errorHandler } from './errorHandler.js'
import { AuthController } from './controllers/AuthController.js'
import type { AuthControllerDeps } from './controllers/AuthController.js'

export async function createServer(deps: AuthControllerDeps, pool: Pool, redis: Redis) {
  const logger = createLogger('auth-service')
  const app = Fastify({ loggerInstance: logger }) as unknown as FastifyInstance

  await app.register(helmet)
  await app.register(cors, { origin: process.env.FRONTEND_URL })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
  await app.register(requestLoggerPlugin)

  app.setErrorHandler(errorHandler)

  app.get('/health', async (request) => {
    const dbDeps: Record<string, 'ok' | 'error'> = {}

    try {
      await pool.query('SELECT 1')
      dbDeps.postgres = 'ok'
    } catch {
      dbDeps.postgres = 'error'
    }

    try {
      await redis.ping()
      dbDeps.redis = 'ok'
    } catch {
      dbDeps.redis = 'error'
    }

    const allHealthy = Object.values(dbDeps).every(v => v === 'ok')
    if (!allHealthy) {
      request.log.warn({ deps: dbDeps }, 'degraded health')
    }

    return {
      status: allHealthy ? 'ok' : 'degraded',
      service: 'auth-service',
      version: '0.1.0',
      uptime: process.uptime(),
      deps: dbDeps,
    }
  })

  const controller = new AuthController(deps)
  controller.register(app)

  return app
}
