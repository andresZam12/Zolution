# =============================================================================
# Zolution Frontend — Dockerfile (Next.js)
# =============================================================================

FROM node:20-alpine AS dev

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
