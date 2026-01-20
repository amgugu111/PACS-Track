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

# Build shared packages
WORKDIR /app/packages/shared-types
RUN npm run build

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

# Install production dependencies
RUN npm install --production

EXPOSE 3000

CMD ["npm", "start"]
