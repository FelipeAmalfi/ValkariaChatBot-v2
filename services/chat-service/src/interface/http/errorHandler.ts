import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '@valkaria/domain'

export function errorHandler(
  error: FastifyError,
  _req: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    void reply.status(error.statusCode).send({ error: error.message, code: error.code })
    return
  }

  if (error.statusCode) {
    void reply.status(error.statusCode).send({ error: error.message })
    return
  }

  void reply.status(500).send({ error: 'Internal server error' })
}
