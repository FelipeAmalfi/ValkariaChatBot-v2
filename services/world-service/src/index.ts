import { buildContainer } from './composition/container.js'
import { createServer } from './interface/http/server.js'

function getEnv() {
  const required: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  }
  for (const [key, val] of Object.entries(required)) {
    if (!val) {
      console.error(`Missing required env var: ${key}`)
      process.exit(1)
    }
  }
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    WORLD_PORT: process.env.WORLD_PORT ?? '3004',
    FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  }
}

const env = getEnv()
const port = parseInt(env.WORLD_PORT, 10)

const { deps, pool } = buildContainer(env)

createServer(deps, pool).then((app) => {
  app.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`world-service listening on port ${port}`)
  })
})
