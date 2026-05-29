import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import mercurius from 'mercurius'
import { typeDefs } from '../graphql/schema.js'
import { createResolvers } from '../graphql/resolvers.js'
import { buildContext } from '../graphql/context.js'
import { errorHandler } from './errorHandler.js'
import type { ContainerDeps } from '../../composition/container.js'

export async function createServer(deps: ContainerDeps) {
  const app = Fastify({ logger: false })

  await app.register(helmet)
  await app.register(cors, { origin: process.env.FRONTEND_URL })
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET! })

  app.setErrorHandler(errorHandler)

  app.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    version: '0.1.0',
  }))

  const resolvers = createResolvers(deps)

  await app.register(mercurius, {
    schema: typeDefs,
    resolvers,
    context: (request) => buildContext(request, app),
    graphiql: process.env.NODE_ENV !== 'production',
  })

  return app
}
