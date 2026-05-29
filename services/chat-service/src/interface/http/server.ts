import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { errorHandler } from './errorHandler.js'
import { registerChatRoutes } from './controllers/ChatController.js'
import type { ValkáriaGraph } from '../graph/builder.js'

export async function createServer(graph: ValkáriaGraph, port: number): Promise<void> {
  const fastify = Fastify({ logger: true })

  await fastify.register(cors, { origin: process.env.FRONTEND_URL ?? '*' })
  await fastify.register(helmet)

  fastify.setErrorHandler(errorHandler)

  fastify.get('/health', async () => ({ status: 'ok' }))

  registerChatRoutes(fastify, graph)

  await fastify.listen({ port, host: '0.0.0.0' })
  fastify.log.info(`chat-service listening on port ${port}`)
}
