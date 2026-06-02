import Fastify, { type FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { join, resolve } from 'path'
import type { Pool } from 'pg'
import type Redis from 'ioredis'
import { createLogger } from '@valkaria/config'
import { requestLoggerPlugin } from './plugins/requestLogger.js'
import { errorHandler } from './errorHandler.js'
import { AuthController } from './controllers/AuthController.js'
import type { AuthControllerDeps } from './controllers/AuthController.js'
import { PlayerController } from './controllers/PlayerController.js'
import type { PlayerControllerDeps } from './controllers/PlayerController.js'

const UPLOADS_DIR = resolve(process.cwd(), 'uploads')
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'

export async function createServer(
  deps: AuthControllerDeps,
  playerDeps: Omit<PlayerControllerDeps, 'uploadsDir' | 'apiUrl'>,
  pool: Pool,
  redis: Redis,
) {
  const logger = createLogger('auth-service')
  const app = Fastify({ loggerInstance: logger }) as unknown as FastifyInstance

  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', '*'],
      },
    },
  })
  await app.register(cors, { origin: true })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })
  await app.register(fastifyMultipart, { limits: { fileSize: 5 * 1024 * 1024 } })
  await app.register(fastifyStatic, { root: UPLOADS_DIR, prefix: '/uploads/' })
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

  const playerController = new PlayerController({ ...playerDeps, uploadsDir: UPLOADS_DIR, apiUrl: API_URL })
  playerController.register(app)

  return app
}
