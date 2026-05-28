import { Pool } from 'pg'

let pool: Pool | null = null

export function getPgPool(connectionString: string, options?: { max?: number }): Pool {
  if (!pool) {
    pool = new Pool({ connectionString, max: options?.max ?? 10 })
    pool.on('error', (err) => console.error('PG pool error:', err))
  }
  return pool
}
