import Fastify, { type FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import mercurius from 'mercurius'
import type { Pool } from 'pg'
import { createLogger } from '@valkaria/config'
import { requestLoggerPlugin } from './plugins/requestLogger.js'
import { typeDefs } from '../graphql/schema.js'
import { createResolvers } from '../graphql/resolvers.js'
import { buildContext } from '../graphql/context.js'
import { errorHandler } from './errorHandler.js'
import type { ContainerDeps } from '../../composition/container.js'

export async function createServer(deps: ContainerDeps, pool: Pool) {
  const logger = createLogger('world-service')
  const app = Fastify({ loggerInstance: logger }) as unknown as FastifyInstance

  await app.register(helmet)
  await app.register(cors, { origin: process.env.FRONTEND_URL })
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

    const allHealthy = Object.values(dbDeps).every(v => v === 'ok')
    if (!allHealthy) {
      request.log.warn({ deps: dbDeps }, 'degraded health')
    }

    return {
      status: allHealthy ? 'ok' : 'degraded',
      service: 'world-service',
      version: '0.1.0',
      uptime: process.uptime(),
      deps: dbDeps,
    }
  })

  const resolvers = createResolvers(deps)

  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    context: (request) => buildContext(request, app),
    graphiql: process.env.NODE_ENV !== 'production',
  })

  return app
}
