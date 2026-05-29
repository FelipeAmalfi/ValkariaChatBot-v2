import 'dotenv/config'
import { createContainer } from './composition/container.js'
import { createServer } from './interface/http/server.js'

async function main() {
  const port = Number(process.env.CHAT_PORT ?? 3003)
  const { graph, deps, pgPool, redis } = await createContainer()
  await createServer(graph, { pgPool, redis, neo4jDriver: deps.neo4jDriver }, port)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
