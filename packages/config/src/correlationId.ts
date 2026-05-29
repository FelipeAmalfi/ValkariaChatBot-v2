import { randomUUID } from 'crypto'

export function getCorrelationId(headers: Record<string, string | string[] | undefined>): string {
  const id = headers['x-request-id']
  if (Array.isArray(id)) return id[0] ?? randomUUID()
  return id ?? randomUUID()
}
