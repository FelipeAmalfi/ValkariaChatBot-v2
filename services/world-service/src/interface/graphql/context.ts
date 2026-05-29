import type { FastifyInstance, FastifyRequest } from 'fastify'

export interface UserPayload {
  sub: string
  role: string
  name: string
}

declare module 'mercurius' {
  interface MercuriusContext {
    user: UserPayload | null
  }
}

export async function buildContext(
  request: FastifyRequest,
  _app: FastifyInstance,
): Promise<{ user: UserPayload | null }> {
  try {
    const user = await request.jwtVerify<UserPayload>()
    return { user }
  } catch {
    return { user: null }
  }
}
