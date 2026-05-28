import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '@valkaria/domain'

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode,
    })
    return
  }
  reply.status(500).send({
    error: 'Internal server error',
    statusCode: 500,
  })
}
