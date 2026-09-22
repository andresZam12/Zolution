# =============================================================================
# Zolution Frontend — Dockerfile
# Development: Angular CLI dev server with hot-reload.
# Production: TODO (Phase 4) — build and serve via nginx.
# =============================================================================

FROM node:20-alpine AS dev

WORKDIR /app

# Copy package manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Copy source (node_modules excluded via .dockerignore)
COPY . .

EXPOSE 4200

# --host 0.0.0.0 required to be accessible from outside the container
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--poll", "500"]
