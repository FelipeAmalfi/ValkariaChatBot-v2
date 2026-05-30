import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { buildTestApp, truncateTestData, createTestPlayer } from '../helpers/buildTestApp.js'

const skip = !process.env.DATABASE_URL

describe.skipIf(skip)('Auth Service — Integration', () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>

  beforeAll(async () => {
    app = await buildTestApp()
  })

  afterEach(async () => {
    await truncateTestData(app.pool)
  })

  afterAll(async () => {
    await app.pool.end()
    await app.close()
  })

  it('registers a player', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: createTestPlayer(),
    })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ name: expect.any(String) })
  })

  it('returns 409 on duplicate name', async () => {
    const player = createTestPlayer()
    await app.inject({ method: 'POST', url: '/auth/register', payload: player })
    const res = await app.inject({ method: 'POST', url: '/auth/register', payload: player })
    expect(res.statusCode).toBe(409)
  })

  it('rejects DM auth with wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/dm',
      payload: { password: 'wrong-password' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('health endpoint responds ok (with mocked deps)', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json().service).toBe('auth-service')
  })
})
