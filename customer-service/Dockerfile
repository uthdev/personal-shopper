# ---- Build Stage ----
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root pnpm files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Install pnpm globally
RUN npm install -g pnpm

# Copy entire monorepo
COPY . .

# Build only this service
ARG SERVICE_NAME
RUN pnpm install --filter ${SERVICE_NAME} --frozen-lockfile
RUN pnpm --filter ${SERVICE_NAME} build

# Deploy service with production deps (legacy mode for pnpm v10)
RUN pnpm deploy --filter ${SERVICE_NAME} --prod --legacy /app/deploy

# ---- Production Stage ----
FROM node:18-alpine AS production

WORKDIR /app

# Copy deploy folder from builder
COPY --from=builder /app/deploy ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -S worker -u 1001 \
  && chown -R worker:nodejs /app
USER worker

ARG PORT=3000
EXPOSE ${PORT}

CMD ["node", "dist/server.js"]