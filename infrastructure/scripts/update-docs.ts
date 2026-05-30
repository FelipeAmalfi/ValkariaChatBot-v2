import Anthropic from '@anthropic-ai/sdk'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()
const DOCS = join(ROOT, 'docs')

const FILE_TO_DOC_MAP: Record<string, string[]> = {
  'services/auth-service': ['services/auth-service.md'],
  'services/chat-service': ['services/chat-service.md'],
  'services/world-service': ['services/world-service.md'],
  'services/ingestion-worker': ['services/ingestion-worker.md'],
  'packages/domain': ['architecture/overview.md'],
  'packages/database': ['architecture/data-model.md'],
  'apps/web': ['development/getting-started.md'],
  'spec/00-context/DECISIONS': ['architecture/decisions.md'],
  'spec/00-context/ARCHITECTURE': ['architecture/overview.md'],
  'spec/00-context/ENVIRONMENT': ['development/environment.md'],
  'spec/00-context/STACK': ['development/stack.md'],
}

function getChangedFiles(): string[] {
  return execSync('git diff HEAD~1 HEAD --name-only').toString().trim().split('\n').filter(Boolean)
}

function getDiff(): string {
  const raw = execSync('git diff HEAD~1 HEAD -- . ":(exclude)package-lock.json"').toString()
  return raw.length > 40_000 ? raw.slice(0, 40_000) + '\n\n[diff truncated]' : raw
}

function getCommitInfo(): { hash: string; message: string; author: string; date: string } {
  const [hash, ...rest] = execSync('git log -1 --format="%H|||%s|||%an|||%ai"').toString().trim().split('|||')
  return { hash: hash.slice(0, 8), message: rest[0], author: rest[1], date: rest[2].slice(0, 10) }
}

function resolveAffectedDocs(changedFiles: string[]): Set<string> {
  const affected = new Set<string>()
  for (const file of changedFiles) {
    for (const [prefix, docs] of Object.entries(FILE_TO_DOC_MAP)) {
      if (file.startsWith(prefix)) docs.forEach(d => affected.add(d))
    }
  }
  return affected
}

function readDoc(docPath: string): string {
  const full = join(DOCS, docPath)
  return existsSync(full) ? readFileSync(full, 'utf8') : ''
}

async function main() {
  const client = new Anthropic()

  const changedFiles = getChangedFiles()
  const diff = getDiff()
  const commit = getCommitInfo()
  const affectedDocs = resolveAffectedDocs(changedFiles)

  const changelogPath = join(DOCS, 'changelog/index.md')
  const existingChangelog = existsSync(changelogPath) ? readFileSync(changelogPath, 'utf8') : '# Changelog\n\n'

  const docsContext = [...affectedDocs].map(docPath => ({
    path: docPath,
    content: readDoc(docPath),
  }))

  const systemPrompt = `You are a technical documentation writer for ValkáriaV2, an RPG chatbot microservices project.

Project: TypeScript monorepo with Fastify services (auth-service :3002, chat-service :3003, world-service :3004), LangGraph AI pipeline, Next.js frontend, PostgreSQL + Redis + Neo4j infrastructure.

Your job:
1. Write a concise changelog entry for the given commit
2. For each affected doc file, rewrite only the sections impacted by the diff — preserve unchanged sections verbatim

Rules:
- Keep technical precision — exact port numbers, package names, method signatures matter
- Do not add sections that don't exist in the original doc unless the diff clearly introduces new functionality
- Changelog entries: one-paragraph max, past tense, technical audience
- Output valid markdown only`

  const userPrompt = `Commit: ${commit.hash} — ${commit.message} (${commit.author}, ${commit.date})

Changed files:
${changedFiles.map(f => `  - ${f}`).join('\n')}

Git diff:
\`\`\`diff
${diff}
\`\`\`

Affected doc pages:
${docsContext.map(d => `\n### ${d.path}\n\`\`\`markdown\n${d.content || '(empty — new file)'}\n\`\`\``).join('\n')}

Respond with a JSON object:
{
  "changelogEntry": "## ${commit.date} — ${commit.message} (${commit.hash})\n\n<paragraph describing what changed and why it matters>",
  "docUpdates": [
    { "path": "services/auth-service.md", "content": "<full updated markdown>" }
  ]
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Claude did not return valid JSON')
    process.exit(1)
  }

  const result = JSON.parse(jsonMatch[0]) as {
    changelogEntry: string
    docUpdates: Array<{ path: string; content: string }>
  }

  // Prepend to changelog (newest first)
  const updatedChangelog = existingChangelog.replace(
    /^# Changelog\n\n/,
    `# Changelog\n\n${result.changelogEntry}\n\n---\n\n`,
  )
  writeFileSync(changelogPath, updatedChangelog)
  console.log('Updated: changelog/index.md')

  // Write affected doc updates
  for (const update of result.docUpdates) {
    const full = join(DOCS, update.path)
    writeFileSync(full, update.content)
    console.log(`Updated: ${update.path}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
