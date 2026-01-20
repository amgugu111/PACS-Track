# Backend Dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy all packages
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies
RUN npm install

# Build packages
WORKDIR /app/packages/database
RUN npm run build

WORKDIR /app/packages/shared-types
RUN npm run build

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy packages
COPY --from=builder /app/packages ./packages

# Copy built backend
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./

# Install production dependencies only
RUN npm install --production

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app

EXPOSE 10000

CMD ["node", "dist/main.js"]
