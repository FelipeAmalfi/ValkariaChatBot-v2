import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { createChildLogger, getCorrelationId } from '@valkaria/config'
import type { Logger } from 'pino'

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
  }
}

export const requestLoggerPlugin = fp(async (app: FastifyInstance) => {
  const baseLogger = app.log as unknown as Logger

  app.addHook('onRequest', async (request) => {
    request.correlationId = getCorrelationId(request.headers as Record<string, string | string[] | undefined>)
    request.log = createChildLogger(baseLogger, request.correlationId, {
      method: request.method,
      url: request.url,
    }) as unknown as typeof request.log
    request.log.info('request started')
  })

  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      statusCode: reply.statusCode,
      duration: reply.elapsedTime,
    }, 'request completed')
  })

  app.addHook('onError', async (request, _reply, error) => {
    request.log.error({ error: error.message, stack: error.stack }, 'request error')
  })
})
