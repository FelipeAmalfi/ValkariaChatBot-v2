import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from '../../src/interface/http/server.js'
import { buildContainer } from '../../src/composition/container.js'

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/valkaria'
const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-32-chars-long!!'

const skip = !process.env.DATABASE_URL

describe.skipIf(skip)('world-service GraphQL', () => {
  let app: Awaited<ReturnType<typeof createServer>>

  beforeAll(async () => {
    process.env.DATABASE_URL = DATABASE_URL
    process.env.JWT_SECRET = JWT_SECRET
    const deps = buildContainer({ DATABASE_URL })
    app = await createServer(deps)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('npcs query returns an array', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ npcs(pageSize: 3) { name faction } }' },
    })
    const body = JSON.parse(res.body)
    expect(body.errors).toBeUndefined()
    expect(Array.isArray(body.data.npcs)).toBe(true)
  })

  it('locations query returns an array', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ locations { name } }' },
    })
    const body = JSON.parse(res.body)
    expect(body.errors).toBeUndefined()
    expect(Array.isArray(body.data.locations)).toBe(true)
  })

  it('players query without DM token returns forbidden error', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      payload: { query: '{ players { id name } }' },
    })
    const body = JSON.parse(res.body)
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toMatch(/DM only/i)
  })
})
