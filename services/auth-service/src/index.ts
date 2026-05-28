import { buildContainer } from './composition/container.js'
import { createServer } from './interface/http/server.js'

function getEnv() {
  const required: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    DM_PASSWORD: process.env.DM_PASSWORD,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  }
  for (const [key, val] of Object.entries(required)) {
    if (!val) {
      console.error(`Missing required env var: ${key}`)
      process.exit(1)
    }
  }
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    AUTH_PORT: process.env.AUTH_PORT ?? '3002',
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '24h',
    DM_PASSWORD: process.env.DM_PASSWORD!,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
    SEMANTIC_AUTH_THRESHOLD: process.env.SEMANTIC_AUTH_THRESHOLD ?? '0.6',
    FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    AI_CLASSIFICATION_MODEL: process.env.AI_CLASSIFICATION_MODEL,
    AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL,
  }
}

const env = getEnv()
const port = parseInt(env.AUTH_PORT, 10)

const deps = buildContainer(env)

createServer(deps).then((app) => {
  app.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    console.log(`auth-service listening on port ${port}`)
  })
})
