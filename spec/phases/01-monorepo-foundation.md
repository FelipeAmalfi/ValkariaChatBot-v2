# Phase 01 — Monorepo Foundation

**Agent**: none (scaffolding — run commands directly)  
**Depends on**: nothing (start here)  
**Service**: repo root

---

## What you're building

The workspace skeleton that all services share: npm workspaces, Turborepo build pipeline, shared TypeScript config, and Docker Compose infrastructure. No application code yet — just the scaffolding that makes all later phases work.

---

## Directory structure

```
valkaria-v2/
├── services/
│   ├── auth-service/
│   ├── chat-service/
│   ├── world-service/
│   └── ingestion-worker/
├── gateway/
├── apps/
│   └── web/
├── packages/
│   ├── domain/
│   ├── shared/
│   └── config/
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── data/              (copy npcs.csv and locations.csv here)
│   └── scripts/
│       └── seed.ts        (placeholder for phase 06)
├── package.json           (root — workspaces config)
├── turbo.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── CLAUDE.md              (references spec/ folder)
```

---

## Files to create

### `package.json` (root)
```json
{
  "name": "valkaria-v2",
  "private": true,
  "workspaces": [
    "services/*",
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev":       "turbo dev",
    "build":     "turbo build",
    "test":      "turbo test",
    "typecheck": "turbo typecheck",
    "lint":      "turbo lint",
    "migrate":   "turbo migrate"
  },
  "devDependencies": {
    "turbo":      "^2.3.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "eslint":     "^9.0.0",
    "prettier":   "^3.4.0"
  }
}
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "migrate": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

### `tsconfig.json` (root — extended by all workspaces)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

### Per-workspace `package.json` stubs

Each workspace needs a minimal `package.json` with correct name and `"main": "dist/index.js"`. Use names from STACK.md. Leave `dependencies` empty for now — each phase adds what it needs.

Example for `packages/domain/package.json`:
```json
{
  "name": "@valkaria/domain",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build":     "tsc",
    "typecheck": "tsc --noEmit",
    "dev":       "tsc --watch"
  }
}
```

Create the same pattern for all 8 workspaces.

### `infrastructure/docker/docker-compose.yml`
```yaml
services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: valkaria
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --save "" --appendonly no
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  neo4j:
    image: neo4j:5.26-community
    environment:
      NEO4J_AUTH: neo4j/valkaria-neo4j-pass
      NEO4J_PLUGINS: '["apoc"]'
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j_data:/data
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "valkaria-neo4j-pass", "RETURN 1"]
      interval: 10s
      timeout: 10s
      retries: 10

volumes:
  postgres_data:
  neo4j_data:
```

### `.env.example`
Copy the full contents from `spec/00-context/ENVIRONMENT.md` section "`.env.example`".

### `.gitignore`
```
node_modules/
dist/
.env
*.env.local
.turbo/
.next/
coverage/
```

### `CLAUDE.md` (root)
```markdown
# ValkáriaV2

RPG chatbot with intelligent NPCs via LangGraph. Microservices monorepo.

Read `spec/00-context/README.md` before starting any development task.

## Quick commands
- `npm run dev` — start all services
- `npm test` — run all tests  
- `npm run typecheck` — TypeScript check
- `docker compose -f infrastructure/docker/docker-compose.yml up -d` — start infra
```

---

## Packages to install

After creating all `package.json` files:
```bash
npm install
```

---

## Acceptance check

Run these commands — all must succeed:

```bash
npm install                    # no errors
npx turbo --version            # prints turbo version
docker compose -f infrastructure/docker/docker-compose.yml up -d
docker compose -f infrastructure/docker/docker-compose.yml ps
# All 3 containers: postgres, redis, neo4j — status "healthy" or "running"
```

Wait 30 seconds after `up -d` for Neo4j to initialize before checking health.
