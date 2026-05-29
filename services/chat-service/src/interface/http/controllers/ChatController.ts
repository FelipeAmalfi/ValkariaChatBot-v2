import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'
import type { ValkáriaGraph } from '../../graph/builder.js'

interface ChatBody {
  message: string
}

export function registerChatRoutes(fastify: FastifyInstance, graph: ValkáriaGraph): void {
  fastify.post<{ Body: ChatBody }>('/chat', {
    schema: {
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', minLength: 1, maxLength: 2000 },
        },
      },
    },
  }, async (request, reply) => {
    const { message } = request.body
    const threadId = (request.headers['x-thread-id'] as string | undefined) ?? randomUUID()
    const correlationId = request.correlationId ?? (request.headers['x-request-id'] as string | undefined) ?? randomUUID()

    const result = await graph.invoke(
      { message },
      { configurable: { thread_id: threadId, correlationId } },
    )

    return reply.send({
      response: result.response ?? '',
      threadId,
    })
  })
}
