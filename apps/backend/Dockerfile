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

# Generate Prisma Client
WORKDIR /app/packages/database
RUN npx prisma generate

# Build shared-types
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
COPY turbo.json ./

# Copy packages from builder
COPY --from=builder /app/packages ./packages

# Copy backend app and build
COPY --from=builder /app/apps/backend ./apps/backend

# Install all dependencies (needed for workspace references)
RUN npm install --production

# Generate Prisma Client for production
WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app/apps/backend

EXPOSE 10000

CMD ["node", "dist/main.js"]
