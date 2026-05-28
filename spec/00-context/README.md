# ValkáriaV2 — Spec-Driven Development Guide

This folder is the **complete self-contained blueprint** for building ValkáriaV2 from zero. Copy this entire `spec/` folder into a blank project and follow the phases in order.

---

## Prerequisites

Before you begin:

- Node.js 20+
- Docker Desktop (v4+, with Compose v2)
- An OpenRouter API key (free tier works): https://openrouter.ai
- Claude Code CLI installed: `npm install -g @anthropic/claude-code`

---

## Bootstrapping a New Project

```bash
# 1. Create blank project folder
mkdir valkaria-v2 && cd valkaria-v2

# 2. Copy the spec into it
cp -r /path/to/original/spec .

# 3. Initialize git
git init && git add spec/ && git commit -m "chore: add spec blueprint"

# 4. Set up Claude Code agents and skills
mkdir -p .claude/agents .claude/skills
cp spec/agents/*.md .claude/agents/
cp spec/skills/*.md .claude/skills/

# 5. Open Claude Code
claude
```

---

## How to Use the Phases

Each phase builds on the previous. **Never skip a phase** — later phases reference files and interfaces created in earlier ones.

```
Execute phase 01    → Claude reads spec/phases/01-monorepo-foundation.md and builds it
(verify it works)
Execute phase 02    → Claude reads spec/phases/02-shared-packages.md and builds it
...and so on through phase 20
```

To execute a phase, say:
> "Execute phase [N] following spec/phases/[N]-[name].md"

Claude will read the spec, build all deliverables, and run the acceptance check.

---

## Reading Order for Context Files

Read these before starting any phase:

| File | Read when |
|---|---|
| `ARCHITECTURE.md` | Before phase 01 — understand the system topology |
| `STACK.md` | Before phase 01 — exact packages and versions |
| `ENVIRONMENT.md` | Before phases 04–11 — all env vars per service |
| `DECISIONS.md` | Any time — architectural decisions and their rationale |

---

## Project Structure (Final Result)

After all 20 phases, the project will look like:

```
valkaria-v2/
├── services/
│   ├── auth-service/       Fastify, port 3002
│   ├── chat-service/       Fastify + LangGraph, port 3003
│   ├── world-service/      Fastify + Mercurius, port 3004
│   └── ingestion-worker/   CLI script (no HTTP server)
├── gateway/
│   └── nginx.conf          Reverse proxy, port 80
├── apps/
│   └── web/                Next.js 15, port 3000
├── packages/
│   ├── domain/             Shared entities, errors, ports
│   ├── shared/             Shared TypeScript primitives
│   └── config/             Shared Pino logger + Zod env factory
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── data/
│   │   ├── npcs.csv
│   │   └── locations.csv
│   └── scripts/
│       └── seed.ts
├── .claude/
│   ├── agents/             Copy from spec/agents/
│   └── skills/             Copy from spec/skills/
├── package.json            Workspaces root
├── turbo.json
├── tsconfig.json
└── .env.example
```

---

## Phase Map

| Phase | Name | Service | Agent |
|---|---|---|---|
| 01 | Monorepo Foundation | root | none (scaffolding) |
| 02 | Shared Packages | packages/* | domain |
| 03 | Infrastructure Layer | packages/database | database |
| 04 | Auth Service | services/auth-service | database, ai-provider |
| 05 | World Service | services/world-service | database, graphql |
| 06 | Data Ingestion | services/ingestion-worker | database, ai-provider |
| 07 | Chat Service Core | services/chat-service | graph-wiring, graph-nodes |
| 08 | Chat Service Retrieval | services/chat-service | graph-nodes |
| 09 | Chat Service Advanced | services/chat-service | graph-nodes |
| 10 | Chat Service Response | services/chat-service | graph-nodes, graph-wiring |
| 11 | API Gateway | gateway/ | none (nginx config) |
| 12 | Web Foundation | apps/web | web-ui |
| 13 | Web Auth Flow | apps/web | web-ui |
| 14 | Web Chat Interface | apps/web | web-ui |
| 15 | Web World Explorer | apps/web | web-ui |
| 16 | Web Character Profile | apps/web | web-ui |
| 17 | Web DM Dashboard | apps/web | web-ui |
| 18 | Observability | all services | none (config) |
| 19 | Testing | all | testing |
| 20 | Deployment | CI/CD | none |

---

## Key Concepts

**Why microservices?**
See `ARCHITECTURE.md` — short answer: chat-service scales independently (LLM calls are expensive), world-service can be cached, auth-service is stateless.

**Why PostgresSaver (not MemorySaver)?**
`MemorySaver` stores LangGraph state in process memory, meaning you can only run one chat-service instance. `PostgresSaver` persists state to PostgreSQL, allowing multiple instances to handle different conversations simultaneously.

**Why narrative auth?**
Players authenticate by describing their character's background in their own words. The system embeds their answer and compares it to the registered profile via cosine similarity (threshold: 0.6). This keeps the RPG immersion intact — no passwords for players.
