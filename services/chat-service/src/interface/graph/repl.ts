import 'dotenv/config'
import readline from 'readline'
import { createContainer } from '../../composition/container.js'

const THREAD_ID = 'dev-session-001'

async function main() {
  const { graph } = await createContainer()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log(`ValkáriaGraph Dev REPL`)
  console.log(`Thread ID: ${THREAD_ID}`)
  console.log(`Type /exit to quit\n`)

  rl.on('line', async (input) => {
    const trimmed = input.trim()
    if (trimmed === '/exit') {
      rl.close()
      process.exit(0)
    }
    if (!trimmed) return

    const result = await graph.invoke(
      { message: trimmed },
      { configurable: { thread_id: THREAD_ID } },
    )

    console.log(`\nNarrador: ${result.response ?? '[sem resposta]'}\n`)
  })
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
