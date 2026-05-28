# Phase 18 — Observability

**Agent**: none (config changes across all services — apply patterns directly)  
**Depends on**: Phase 11  
**Service**: all backend services + `packages/config/`

---

## What you're building

Structured logging with correlation IDs and enhanced health checks. After this phase, every request that enters the system generates correlated log lines across all services it touches, enabling debugging without distributed tracing infrastructure.

This phase does NOT require Jaeger, Zipkin, or OpenTelemetry agents in production — just structured JSON logs that can be searched.

---

## Changes to `packages/config/`

### Update `src/logger.ts`

```typescript
import pino, { type Logger } from 'pino'

export interface LoggerOptions {
  service: string
  correlationId?: string
}

export function createLogger(service: string): Logger {
  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      },
    }),
  })
}

export function createChildLogger(logger: Logger, correlationId: string, extra?: Record<string, unknown>): Logger {
  return logger.child({ correlationId, ...extra })
}
```

### Add `src/correlationId.ts`

```typescript
import { randomUUID } from 'crypto'

export function getCorrelationId(headers: Record<string, string | string[] | undefined>): string {
  const id = headers['x-request-id']
  if (Array.isArray(id)) return id[0] ?? randomUUID()
  return id ?? randomUUID()
}
```

---

## Fastify request logging plugin (apply to all 3 services)

Create `src/interface/http/plugins/requestLogger.ts` in each service:

```typescript
import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import { createChildLogger, getCorrelationId } from '@valkaria/config'
import type { Logger } from 'pino'

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string
    log: Logger
  }
}

export const requestLoggerPlugin = fp(async (app: FastifyInstance) => {
  const baseLogger = app.log as unknown as Logger
  
  app.addHook('onRequest', async (request) => {
    request.correlationId = getCorrelationId(request.headers as Record<string, string>)
    request.log = createChildLogger(baseLogger, request.correlationId, {
      method: request.method,
      url: request.url,
    })
    request.log.info('request started')
  })
  
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      statusCode: reply.statusCode,
      duration: reply.elapsedTime,
    }, 'request completed')
  })
  
  app.addHook('onError', async (request, _reply, error) => {
    request.log.error({ error: error.message, stack: error.stack }, 'request error')
  })
})
```

Install `fastify-plugin`:
```bash
npm install fastify-plugin -w @valkaria/auth-service
npm install fastify-plugin -w @valkaria/chat-service
npm install fastify-plugin -w @valkaria/world-service
```

Register in each `server.ts`:
```typescript
await app.register(requestLoggerPlugin)
```

Pass Pino logger to Fastify:
```typescript
const logger = createLogger('auth-service')
const app = Fastify({ loggerInstance: logger })
```

---

## Enhanced health checks (all 3 services)

Replace the simple `{ status: 'ok' }` response with a dependency-aware check:

```typescript
// In each service's server.ts
app.get('/health', async (request) => {
  const deps: Record<string, 'ok' | 'error'> = {}
  
  // PostgreSQL check
  try {
    await pool.query('SELECT 1')
    deps.postgres = 'ok'
  } catch {
    deps.postgres = 'error'
  }
  
  // Redis check (auth-service + chat-service only)
  try {
    await redis.ping()
    deps.redis = 'ok'
  } catch {
    deps.redis = 'error'
  }
  
  // Neo4j check (chat-service + world-service only)
  try {
    const session = neo4jDriver.session()
    await session.run('RETURN 1')
    await session.close()
    deps.neo4j = 'ok'
  } catch {
    deps.neo4j = 'error'
  }
  
  const allHealthy = Object.values(deps).every(v => v === 'ok')
  
  return {
    status: allHealthy ? 'ok' : 'degraded',
    service: 'auth-service',  // or chat-service, world-service
    version: '0.1.0',
    uptime: process.uptime(),
    deps,
  }
})
```

The HTTP status should be `200` for both `ok` and `degraded` — some load balancers mark a service unhealthy on non-200. Log a warning if any dep is `'error'`.

---

## Log format reference

Every log line should be valid JSON (in production — pretty in dev):

```json
{
  "level": "info",
  "time": 1735000000000,
  "name": "auth-service",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/auth/validate",
  "statusCode": 200,
  "duration": 847,
  "msg": "request completed"
}
```

For errors:
```json
{
  "level": "error",
  "name": "chat-service",
  "correlationId": "...",
  "error": "OpenRouter rate limit exceeded",
  "stack": "AIProviderError: ...",
  "msg": "request error"
}
```

---

## Forward correlation ID from chat-service to other deps

When `chat-service` makes internal calls (via repositories to PostgreSQL, Neo4j), attach the correlation ID to the log context:

```typescript
// In LangGraph nodes that use deps, the correlationId is available in the config:
// config?.configurable?.correlationId

// In ChatController:
const correlationId = request.headers['x-request-id'] as string
await graph.invoke(
  { messages: [...] },
  { configurable: { thread_id: threadId, correlationId } }
)
```

Inside nodes, use `deps.logger.child({ correlationId })` for structured logging.

---

## Optional: Grafana + Loki (dev only)

Add to `docker-compose.yml` as optional dev services (commented out by default):

```yaml
# Uncomment for log aggregation in dev
# loki:
#   image: grafana/loki:3.3.0
#   ports: ["3100:3100"]
# 
# grafana:
#   image: grafana/grafana:11.4.0
#   ports: ["3030:3000"]
#   environment:
#     GF_AUTH_ANONYMOUS_ENABLED: "true"
```

If enabled, add Pino Loki transport to services:
```bash
npm install pino-loki -w @valkaria/chat-service
```

---

## Acceptance check

1. Start all services
2. Send a chat message: `curl -X POST http://localhost:80/chat -H "Content-Type: application/json" -H "x-thread-id: obs-test" -d '{"message":"Olá"}'`
3. Observe service logs — each should show a JSON line containing `correlationId` (the `X-Request-ID` Nginx injected)
4. Check health: `curl http://localhost:80/auth/health` → response shows `deps: { postgres: 'ok', redis: 'ok' }`
5. Run `npm run typecheck` → 0 errors
