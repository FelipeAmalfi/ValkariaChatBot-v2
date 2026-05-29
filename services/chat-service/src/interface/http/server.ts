import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import type { Pool } from 'pg'
import type Redis from 'ioredis'
import type { Driver } from 'neo4j-driver'
import { createLogger } from '@valkaria/config'
import { requestLoggerPlugin } from './plugins/requestLogger.js'
import { errorHandler } from './errorHandler.js'
import { registerChatRoutes } from './controllers/ChatController.js'
import type { ValkáriaGraph } from '../graph/builder.js'

interface HealthDeps {
  pgPool: Pool
  redis: Redis
  neo4jDriver: Driver
}

export async function createServer(graph: ValkáriaGraph, healthDeps: HealthDeps, port: number): Promise<void> {
  const logger = createLogger('chat-service')
  const fastify = Fastify({ loggerInstance: logger }) as unknown as FastifyInstance

  await fastify.register(cors, { origin: process.env.FRONTEND_URL ?? '*' })
  await fastify.register(helmet)
  await fastify.register(requestLoggerPlugin)

  fastify.setErrorHandler(errorHandler)

  fastify.get('/health', async (request) => {
    const deps: Record<string, 'ok' | 'error'> = {}

    try {
      await healthDeps.pgPool.query('SELECT 1')
      deps.postgres = 'ok'
    } catch {
      deps.postgres = 'error'
    }

    try {
      await healthDeps.redis.ping()
      deps.redis = 'ok'
    } catch {
      deps.redis = 'error'
    }

    try {
      const session = healthDeps.neo4jDriver.session()
      await session.run('RETURN 1')
      await session.close()
      deps.neo4j = 'ok'
    } catch {
      deps.neo4j = 'error'
    }

    const allHealthy = Object.values(deps).every(v => v === 'ok')
    if (!allHealthy) {
      request.log.warn({ deps }, 'degraded health')
    }

    return {
      status: allHealthy ? 'ok' : 'degraded',
      service: 'chat-service',
      version: '0.1.0',
      uptime: process.uptime(),
      deps,
    }
  })

  registerChatRoutes(fastify, graph)

  await fastify.listen({ port, host: '0.0.0.0' })
  fastify.log.info(`chat-service listening on port ${port}`)
}
