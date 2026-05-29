# Phase 21 — Documentation

**Agent**: none (apply directly)  
**Depends on**: Phase 20  
**Service**: docs/ (new), .github/workflows/, infrastructure/scripts/

---

## What you're building

A VitePress documentation site (`docs/`) deployed automatically to GitHub Pages, plus a GitHub Actions workflow that runs on every push to `dev` and uses the Claude API to:
1. Generate a changelog entry for the commit
2. Detect which doc pages are affected by the diff
3. Rewrite those pages to reflect the new state of the code

After this phase, the project has living documentation that stays in sync with every `dev` push — no manual doc work required.

---

## Tool choice rationale

**VitePress** (free, open source): markdown-native static site generator built on Vite + Vue. Chosen because:
- The project already has extensive markdown in `spec/` — VitePress renders it as-is
- Zero-config search, sidebar, dark mode out of the box
- GitHub Pages deploy in under 60s
- No extra runtime — just a `devDependency`

---

## Dependencies

Add to root `package.json` devDependencies:
```json
{
  "vitepress": "^1.5.0",
  "@anthropic-ai/sdk": "^0.39.0"
}
```

Add to root `package.json` scripts:
```json
{
  "docs:dev":   "vitepress dev docs",
  "docs:build": "vitepress build docs",
  "docs:preview": "vitepress preview docs"
}
```

---

## Docs folder structure

```
docs/
├── .vitepress/
│   └── config.ts
├── index.md                      # Landing page (hero)
├── architecture/
│   ├── overview.md               # Migrated from spec/00-context/ARCHITECTURE.md
│   ├── decisions.md              # ADRs from spec/00-context/DECISIONS.md
│   └── data-model.md             # DB + Redis + Neo4j schema reference
├── services/
│   ├── auth-service.md
│   ├── chat-service.md
│   ├── world-service.md
│   └── ingestion-worker.md
├── development/
│   ├── getting-started.md        # From spec/00-context/README.md
│   ├── environment.md            # From spec/00-context/ENVIRONMENT.md
│   └── stack.md                  # From spec/00-context/STACK.md
└── changelog/
    └── index.md                  # Auto-generated; one entry per dev push
```

---

## `docs/.vitepress/config.ts`

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ValkáriaV2',
  description: 'RPG chatbot with intelligent NPCs via LangGraph',
  base: '/ValkariaChatBot-v2/',

  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'Services', link: '/services/auth-service' },
      { text: 'Development', link: '/development/getting-started' },
      { text: 'Changelog', link: '/changelog/' },
    ],

    sidebar: {
      '/architecture/': [
        { text: 'Overview', link: '/architecture/overview' },
        { text: 'Decisions (ADRs)', link: '/architecture/decisions' },
        { text: 'Data Model', link: '/architecture/data-model' },
      ],
      '/services/': [
        { text: 'auth-service', link: '/services/auth-service' },
        { text: 'chat-service', link: '/services/chat-service' },
        { text: 'world-service', link: '/services/world-service' },
        { text: 'ingestion-worker', link: '/services/ingestion-worker' },
      ],
      '/development/': [
        { text: 'Getting Started', link: '/development/getting-started' },
        { text: 'Environment Vars', link: '/development/environment' },
        { text: 'Stack Reference', link: '/development/stack' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/FelipeAmalfi/ValkariaChatBot-v2' },
    ],

    search: { provider: 'local' },

    footer: {
      message: 'ValkáriaV2 — spec-driven RPG chatbot',
    },
  },
})
```

---

## `docs/index.md` (landing page)

```markdown
---
layout: home

hero:
  name: ValkáriaV2
  text: RPG Chatbot with Intelligent NPCs
  tagline: Microservices monorepo — LangGraph AI pipeline — Dark Fantasy UI
  actions:
    - theme: brand
      text: Architecture
      link: /architecture/overview
    - theme: alt
      text: Getting Started
      link: /development/getting-started

features:
  - title: Narrative Authentication
    details: Players authenticate by describing their character's backstory — no passwords, full RPG immersion. Cosine similarity threshold 0.6.
  - title: LangGraph Pipeline
    details: 16-node state machine with 24 intents. Every conversation turn loads state from PostgreSQL, runs the graph, and persists back.
  - title: Microservices Monorepo
    details: auth-service, chat-service, world-service, ingestion-worker — independently deployable, shared packages via npm workspaces.
---
```

---

## Initial doc content (seed from spec)

Seed each file by copying and reformatting the corresponding spec source. Use these mappings:

| Doc file | Source |
|---|---|
| `architecture/overview.md` | `spec/00-context/ARCHITECTURE.md` |
| `architecture/decisions.md` | `spec/00-context/DECISIONS.md` |
| `architecture/data-model.md` | DB Schema section of `ARCHITECTURE.md` |
| `development/getting-started.md` | `spec/00-context/README.md` |
| `development/environment.md` | `spec/00-context/ENVIRONMENT.md` |
| `development/stack.md` | `spec/00-context/STACK.md` |
| `services/auth-service.md` | Phase 04 spec + `ARCHITECTURE.md` auth-service section |
| `services/chat-service.md` | Phases 07–10 specs + `ARCHITECTURE.md` chat-service section |
| `services/world-service.md` | Phase 05 spec + `ARCHITECTURE.md` world-service section |
| `services/ingestion-worker.md` | Phase 06 spec + `ARCHITECTURE.md` ingestion-worker section |
| `changelog/index.md` | Empty initially — filled by automation |

The service pages follow this template:
```markdown
# [Service Name]

**Port**: XXXX | **Package**: `@valkaria/service-name`

## Responsibilities
[from ARCHITECTURE.md]

## API Endpoints / Schema
[from phase spec]

## Data owned
[from ARCHITECTURE.md DB schema section]

## Environment variables
[from ENVIRONMENT.md]

## Key design decisions
[relevant ADRs]
```

---

## Auto-documentation script

### `infrastructure/scripts/update-docs.ts`

```typescript
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
```

---

## GitHub Actions workflows

### `.github/workflows/docs-deploy.yml`

Deploys VitePress to GitHub Pages on push to `main`.

```yaml
name: Deploy Docs

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run docs:build

      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### `.github/workflows/docs-update.yml`

Runs on push to `dev`. Calls Claude API, writes updated docs, commits back.

```yaml
name: Auto-update Docs

on:
  push:
    branches: [dev]

permissions:
  contents: write

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Update docs via Claude API
        run: npx tsx infrastructure/scripts/update-docs.ts
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit doc updates
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/
          git diff --staged --quiet || git commit -m "docs: auto-update for $(git log -1 --format='%s' HEAD~1)"
          git push
```

---

## GitHub repository setup

1. **Enable GitHub Pages**: Settings → Pages → Source: **GitHub Actions**
2. **Add secret**: Settings → Secrets → Actions → New: `ANTHROPIC_API_KEY` (your key from console.anthropic.com)
3. **Set base URL**: In `docs/.vitepress/config.ts`, set `base` to match your repo name:
   ```typescript
   base: '/ValkariaChatBot-v2/',  // must match GitHub repo name exactly
   ```

---

## `.gitignore` additions

Add to root `.gitignore`:
```
docs/.vitepress/dist
docs/.vitepress/cache
```

---

## Acceptance check

```bash
# 1. Dev server runs
npm run docs:dev
# → open http://localhost:5173 — sidebar, search, dark mode work

# 2. Build succeeds
npm run docs:build
# → docs/.vitepress/dist/ exists

# 3. Script runs locally
ANTHROPIC_API_KEY=sk-ant-... npx tsx infrastructure/scripts/update-docs.ts
# → prints "Updated: changelog/index.md" and any affected doc paths
# → changelog/index.md has a new entry at the top

# 4. Push to dev → check GitHub Actions tab → docs-update job green → new commit on dev with updated docs
# 5. Merge dev → main → docs-deploy job green → GitHub Pages URL live
```

---

## What triggers doc updates

| Changed path prefix | Affected doc page |
|---|---|
| `services/auth-service/` | `services/auth-service.md` |
| `services/chat-service/` | `services/chat-service.md` |
| `services/world-service/` | `services/world-service.md` |
| `services/ingestion-worker/` | `services/ingestion-worker.md` |
| `packages/domain/` | `architecture/overview.md` |
| `packages/database/` | `architecture/data-model.md` |
| `apps/web/` | `development/getting-started.md` |
| `spec/00-context/DECISIONS*` | `architecture/decisions.md` |
| `spec/00-context/ARCHITECTURE*` | `architecture/overview.md` |
| `spec/00-context/ENVIRONMENT*` | `development/environment.md` |
| `spec/00-context/STACK*` | `development/stack.md` |
| Any file | `changelog/index.md` (always) |
