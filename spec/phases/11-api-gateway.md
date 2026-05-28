# Phase 11 — API Gateway

**Agent**: none (nginx config — no application code)  
**Depends on**: Phase 04, 05, 10  
**Service**: `gateway/`

---

## What you're building

An Nginx reverse proxy that sits in front of all services. After this phase, all client requests go through a single port (80) and are routed to the correct service by URL prefix. Rate limiting and request ID injection happen here, not in individual services.

---

## Directory structure

```
gateway/
├── nginx.conf
└── Dockerfile
```

Add to `infrastructure/docker/docker-compose.yml`.

---

## Files to create

### `gateway/nginx.conf`

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    # Request ID generation for distributed tracing
    map $http_x_request_id $request_id_final {
        default $http_x_request_id;
        ""      $request_id;
    }

    # Rate limiting: 100 req/min per IP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

    # Upstream definitions
    upstream auth_service {
        server auth-service:3002;
        keepalive 32;
    }

    upstream chat_service {
        server chat-service:3003;
        keepalive 32;
    }

    upstream world_service {
        server world-service:3004;
        keepalive 32;
    }

    upstream web_app {
        server web:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Inject request ID header on all responses
        add_header X-Request-ID $request_id_final always;

        # Common proxy headers
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-ID      $request_id_final;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Auth service
        location /auth {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://auth_service;
        }

        # Chat service
        location /chat {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://chat_service;
            proxy_read_timeout 60s;  # LLM calls can be slow
        }

        location /session {
            proxy_pass http://chat_service;
        }

        # World service — GraphQL
        location /graphql {
            limit_req zone=api_limit burst=30 nodelay;
            proxy_pass http://world_service;
        }

        location /world/health {
            proxy_pass http://world_service/health;
        }

        # Gateway health check (does not proxy — responds directly)
        location /health {
            access_log off;
            return 200 '{"status":"ok","service":"gateway"}';
            add_header Content-Type application/json;
        }

        # Web app (catch-all)
        location / {
            proxy_pass http://web_app;
            proxy_set_header Upgrade    $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # 429 response for rate limited requests
        error_page 429 = @rate_limited;
        location @rate_limited {
            add_header Content-Type application/json always;
            return 429 '{"error":"Too many requests","statusCode":429}';
        }
    }
}
```

### `gateway/Dockerfile`

```dockerfile
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/nginx.conf

# Health check via gateway's own /health endpoint
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/health || exit 1

EXPOSE 80
```

### Update `infrastructure/docker/docker-compose.yml`

Add the gateway service and the web service. Update all backend services to use internal Docker network names (not `localhost`):

```yaml
services:
  # ... existing postgres, redis, neo4j services ...

  auth-service:
    build:
      context: ../..
      dockerfile: services/auth-service/Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/valkaria
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    env_file: ../../.env
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3002/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  chat-service:
    build:
      context: ../..
      dockerfile: services/chat-service/Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/valkaria
      - REDIS_URL=redis://redis:6379
      - NEO4J_URI=bolt://neo4j:7687
    env_file: ../../.env
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
      neo4j:    { condition: service_healthy }

  world-service:
    build:
      context: ../..
      dockerfile: services/world-service/Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/valkaria
      - NEO4J_URI=bolt://neo4j:7687
    env_file: ../../.env
    depends_on:
      postgres: { condition: service_healthy }
      neo4j:    { condition: service_healthy }

  web:
    build:
      context: ../..
      dockerfile: apps/web/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:80
      - NEXT_PUBLIC_GRAPHQL_URL=http://localhost:80/graphql

  gateway:
    build:
      context: ../../gateway
    ports:
      - "80:80"
    depends_on:
      auth-service:  { condition: service_healthy }
      chat-service:  { condition: service_started }
      world-service: { condition: service_started }
      web:           { condition: service_started }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:80/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

---

## Key implementation notes

1. In Docker Compose, services communicate via service names, not `localhost`. `auth-service:3002` is the correct address inside the Docker network.
2. `proxy_read_timeout 60s` on `/chat` is essential — LLM calls take 15-30 seconds and default Nginx timeout (60s) is borderline. Increase to 120s if needed.
3. The `X-Request-ID` injection: if the client sends one, pass it through; if not, Nginx generates one via `$request_id`. This enables end-to-end tracing (phase 18).
4. The `/health` gateway endpoint returns directly without proxying — useful for load balancer health checks that don't need to verify backend services.
5. `burst=20` on auth allows quick retry of failed requests (e.g., auth challenge → validate in rapid succession). `burst=10` on chat is lower since LLM calls are expensive.

---

## Development note

During local development (phases 01-10), you ran services directly with `npm run dev`. With the gateway, you have two options:
- **With Docker**: `docker compose up` — everything behind the gateway on port 80
- **Without Docker**: continue using service ports directly (3002, 3003, 3004) — gateway is not needed for REPL testing

The gateway is only required for the web frontend and for end-to-end testing.

---

## Acceptance check

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build -d
```

Wait 30-60 seconds for all services to initialize, then run the `verify-api` skill using port 80 (gateway mode):

```bash
# Gateway health
curl http://localhost:80/health
# → {"status":"ok","service":"gateway"}

# Verify X-Request-ID header injection
curl -sv http://localhost:80/health 2>&1 | grep -i "x-request-id"
# → < X-Request-ID: <uuid>

# Auth through gateway
curl http://localhost:80/auth/health
# → {"status":"ok",...}

# GraphQL through gateway
curl -X POST http://localhost:80/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ npcs(pageSize:1) { name } }"}'
```

All must return 200 with valid JSON.
