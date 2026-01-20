# Frontend Dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy packages
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN npm install

# Build shared-types if needed
WORKDIR /app/packages/shared-types
RUN npm run build || true

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy built app
COPY --from=builder /app/apps/frontend/.next ./.next
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/package*.json ./
COPY --from=builder /app/apps/frontend/next.config.js ./

# Copy node_modules from builder (includes workspace packages)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/frontend/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
