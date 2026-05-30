# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace files
COPY package.json turbo.json tsconfig.json ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY services/chat-service/package.json ./services/chat-service/

# Install dependencies
RUN npm ci --workspace=@valkaria/chat-service

# Copy source
COPY packages/ ./packages/
COPY services/chat-service/ ./services/chat-service/

# Build
RUN npm run build -w @valkaria/domain
RUN npm run build -w @valkaria/shared
RUN npm run build -w @valkaria/config
RUN npm run build -w @valkaria/database
RUN npm run build -w @valkaria/chat-service

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S valkaria -u 1001

# Copy built artifacts
COPY --from=builder --chown=valkaria:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=valkaria:nodejs /app/packages ./packages
COPY --from=builder --chown=valkaria:nodejs /app/services/chat-service/dist ./services/chat-service/dist
COPY --from=builder --chown=valkaria:nodejs /app/services/chat-service/package.json ./services/chat-service/

USER valkaria
WORKDIR /app/services/chat-service

EXPOSE 3003
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "dist/index.js"]
