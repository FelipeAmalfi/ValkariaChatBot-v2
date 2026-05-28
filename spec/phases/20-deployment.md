# Phase 20 — Deployment

**Agent**: none (config files — apply directly)  
**Depends on**: Phase 19  
**Service**: all

---

## What you're building

Production-ready Dockerfiles for each service, a GitHub Actions CI pipeline that runs on every push, and deployment configuration for Render (API services) and Vercel (web). After this phase, a push to `main` triggers CI and enables one-click deployment to production.

---

## Dockerfiles

### `services/auth-service/Dockerfile`
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package.json turbo.json tsconfig.json ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY services/auth-service/package.json ./services/auth-service/

# Install dependencies
RUN npm ci --workspace=@valkaria/auth-service

# Copy source
COPY packages/ ./packages/
COPY services/auth-service/ ./services/auth-service/

# Build
RUN npm run build -w @valkaria/domain
RUN npm run build -w @valkaria/shared
RUN npm run build -w @valkaria/config
RUN npm run build -w @valkaria/database
RUN npm run build -w @valkaria/auth-service

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S valkaria -u 1001

# Copy built artifacts
COPY --from=builder --chown=valkaria:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=valkaria:nodejs /app/packages ./packages
COPY --from=builder --chown=valkaria:nodejs /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder --chown=valkaria:nodejs /app/services/auth-service/package.json ./services/auth-service/

USER valkaria
WORKDIR /app/services/auth-service

EXPOSE 3002
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
```

Apply the same pattern for `services/chat-service/Dockerfile` (EXPOSE 3003) and `services/world-service/Dockerfile` (EXPOSE 3004).

### `apps/web/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN npm ci --workspace=@valkaria/web

COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

RUN npm run build -w @valkaria/shared
RUN npm run build -w @valkaria/web

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
```

Add to `apps/web/next.config.ts`:
```typescript
const config: NextConfig = {
  output: 'standalone',
  // ... rest of config
}
```

---

## GitHub Actions CI

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build -w @valkaria/domain
      - run: npm run build -w @valkaria/shared
      - run: npm run build -w @valkaria/config
      - run: npm run build -w @valkaria/database
      - run: npm test   # unit tests only (no Docker)
        env:
          NODE_ENV: test

  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: valkaria_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 5s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build -w @valkaria/domain
      - run: npm run build -w @valkaria/shared
      - run: npm run build -w @valkaria/config
      - run: npm run build -w @valkaria/database
      - run: npm run build -w @valkaria/auth-service
      - name: Run integration tests
        run: npm test -w @valkaria/auth-service -- --run integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/valkaria_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-minimum-32-characters-here
          DM_PASSWORD: test-dm-pass
          OPENROUTER_API_KEY: unused-in-integration-tests

  build-docker:
    runs-on: ubuntu-latest
    needs: [typecheck, test-unit]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build auth-service image
        run: docker build -f services/auth-service/Dockerfile -t valkaria-auth:${{ github.sha }} .
      - name: Build chat-service image
        run: docker build -f services/chat-service/Dockerfile -t valkaria-chat:${{ github.sha }} .
      - name: Build world-service image
        run: docker build -f services/world-service/Dockerfile -t valkaria-world:${{ github.sha }} .
```

---

## Production environment files

### `.env.production.example`

```bash
# ─── SHARED ──────────────────────────────────────────────────────
NODE_ENV=production
DATABASE_URL=<supabase-pooler-url>       # Supabase → Project Settings → Database → Connection Pooler
REDIS_URL=<upstash-redis-url>            # Upstash → Redis → Connect → Node.js URL

# ─── AUTH SERVICE (Render) ───────────────────────────────────────
AUTH_PORT=10000                          # Render injects PORT automatically — use process.env.PORT ?? 3002
JWT_SECRET=<openssl rand -hex 32>
JWT_EXPIRES_IN=24h
DM_PASSWORD=<strong-password-min-8>
OPENROUTER_API_KEY=<sk-or-v1-...>
SEMANTIC_AUTH_THRESHOLD=0.6
FRONTEND_URL=https://your-app.vercel.app

# ─── CHAT SERVICE (Render) ──────────────────────────────────────
CHAT_PORT=10000
JWT_SECRET=<same as auth-service>        # MUST MATCH
OPENROUTER_API_KEY=<sk-or-v1-...>
NEO4J_URI=neo4j+s://<aura-id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<neo4j-aura-password>
AI_CHAT_MODEL=mistralai/mistral-7b-instruct:free
FRONTEND_URL=https://your-app.vercel.app

# ─── WORLD SERVICE (Render) ─────────────────────────────────────
WORLD_PORT=10000
JWT_SECRET=<same as auth-service>
NEO4J_URI=neo4j+s://<aura-id>.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<neo4j-aura-password>
FRONTEND_URL=https://your-app.vercel.app

# ─── WEB (Vercel) ───────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_GRAPHQL_URL=https://api.your-domain.com/graphql
```

---

## Render deployment config

### `render.yaml` (optional — Render supports infrastructure-as-code)
```yaml
services:
  - type: web
    name: valkaria-auth
    runtime: docker
    dockerfilePath: services/auth-service/Dockerfile
    dockerContext: .
    envVars:
      - key: NODE_ENV
        value: production
      - key: AUTH_PORT
        fromService: { type: web, name: valkaria-auth, envVarKey: PORT }

  - type: web
    name: valkaria-chat
    runtime: docker
    dockerfilePath: services/chat-service/Dockerfile
    dockerContext: .

  - type: web
    name: valkaria-world
    runtime: docker
    dockerfilePath: services/world-service/Dockerfile
    dockerContext: .
```

### Render notes
- Render injects `PORT` automatically. In each service's `index.ts`: `const port = parseInt(process.env.PORT ?? process.env.AUTH_PORT ?? '3002')`
- `JWT_SECRET` must be the same value across all three services — set it as a shared environment group in Render dashboard.
- Free tier: 512MB RAM, sleeps after 15min inactivity. Upgrade to Starter ($7/mo) for always-on.

---

## Vercel deployment config

### `vercel.json` (place in repo root)
```json
{
  "buildCommand": "npm run build -w @valkaria/shared && npm run build -w @valkaria/web",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "rootDirectory": "apps/web"
}
```

Set in Vercel dashboard:
- **Root Directory**: `apps/web`
- **Build Command**: override with `cd ../.. && npm run build -w @valkaria/shared && npm run build -w @valkaria/web`
- Add `NEXT_PUBLIC_*` env vars in Vercel dashboard

---

## Production infrastructure services

| Service | Provider | Free tier |
|---|---|---|
| PostgreSQL + pgvector | Supabase | 500MB, 2 cores |
| Redis | Upstash | 256MB, 10K cmd/day |
| Neo4j | Neo4j Aura Free | 200K nodes, 400K rels |
| API services | Render | Free (sleeps) / Starter $7/svc |
| Web | Vercel | Free (hobby) |

---

## Acceptance check

```bash
# CI simulation locally
npm run typecheck && npm run lint && npm test

# Docker build verification
docker build -f services/auth-service/Dockerfile -t test-auth .
docker run --rm -e DATABASE_URL=... -e JWT_SECRET=... test-auth node -e "console.log('OK')"

# Verify standalone Next.js build
npm run build -w @valkaria/web
ls apps/web/.next/standalone/   # should exist
```

Push to `main` → CI pipeline runs → all jobs green → deploy manually to Render via dashboard.
