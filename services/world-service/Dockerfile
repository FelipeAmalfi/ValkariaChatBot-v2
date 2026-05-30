# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package.json turbo.json tsconfig.json ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY services/world-service/package.json ./services/world-service/

# Install dependencies
RUN npm ci --workspace=@valkaria/world-service

# Copy source
COPY packages/ ./packages/
COPY services/world-service/ ./services/world-service/

# Build
RUN npm run build -w @valkaria/domain
RUN npm run build -w @valkaria/shared
RUN npm run build -w @valkaria/config
RUN npm run build -w @valkaria/database
RUN npm run build -w @valkaria/world-service

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S valkaria -u 1001

# Copy built artifacts
COPY --from=builder --chown=valkaria:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=valkaria:nodejs /app/packages ./packages
COPY --from=builder --chown=valkaria:nodejs /app/services/world-service/dist ./services/world-service/dist
COPY --from=builder --chown=valkaria:nodejs /app/services/world-service/package.json ./services/world-service/

USER valkaria
WORKDIR /app/services/world-service

EXPOSE 3004
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3004/health || exit 1

CMD ["node", "dist/index.js"]
