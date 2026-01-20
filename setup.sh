#!/bin/bash

# PACS-Track Quick Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🚀 PACS-Track Quick Setup"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📦 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Check if Yarn is installed
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}⚠️  Yarn not found. Installing Yarn...${NC}"
    npm install -g yarn
fi
echo -e "${GREEN}✅ Yarn found: $(yarn --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed.${NC}"
    echo "Please install PostgreSQL 14+ before continuing."
    echo "macOS: brew install postgresql@14"
    echo "Ubuntu: sudo apt-get install postgresql"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL found${NC}"

echo ""
echo "📥 Installing dependencies..."
yarn install

echo ""
echo "🔧 Setting up environment files..."

# Database package .env
if [ ! -f "packages/database/.env" ]; then
    echo "Creating packages/database/.env"
    read -p "Enter PostgreSQL username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -sp "Enter PostgreSQL password: " DB_PASS
    echo ""
    
    read -p "Enter database name (default: pacs_track): " DB_NAME
    DB_NAME=${DB_NAME:-pacs_track}
    
    cat > packages/database/.env << EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
EOF
    echo -e "${GREEN}✅ Created packages/database/.env${NC}"
else
    echo -e "${YELLOW}⚠️  packages/database/.env already exists, skipping${NC}"
fi

# Backend .env
if [ ! -f "apps/backend/.env" ]; then
    echo "Creating apps/backend/.env"
    cat > apps/backend/.env << EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public"
PORT=3001
NODE_ENV=development
EOF
    echo -e "${GREEN}✅ Created apps/backend/.env${NC}"
else
    echo -e "${YELLOW}⚠️  apps/backend/.env already exists, skipping${NC}"
fi

# Frontend .env.local
if [ ! -f "apps/frontend/.env.local" ]; then
    echo "Creating apps/frontend/.env.local"
    cat > apps/frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo -e "${GREEN}✅ Created apps/frontend/.env.local${NC}"
else
    echo -e "${YELLOW}⚠️  apps/frontend/.env.local already exists, skipping${NC}"
fi

echo ""
echo "🗄️  Setting up database..."

# Create database if it doesn't exist
echo "Creating database ${DB_NAME}..."
PGPASSWORD="${DB_PASS}" psql -U "${DB_USER}" -h localhost -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
PGPASSWORD="${DB_PASS}" psql -U "${DB_USER}" -h localhost -c "CREATE DATABASE ${DB_NAME};"

echo -e "${GREEN}✅ Database ready${NC}"

echo ""
echo "🔨 Generating Prisma client..."
yarn db:generate

echo ""
echo "📊 Pushing schema to database..."
yarn db:push

echo ""
read -p "Would you like to seed sample data? (y/n): " SEED_CHOICE
if [ "$SEED_CHOICE" = "y" ] || [ "$SEED_CHOICE" = "Y" ]; then
    echo "🌱 Seeding database..."
    cd packages/database
    npx ts-node prisma/seed.ts
    cd ../..
    echo -e "${GREEN}✅ Sample data added${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo "To start development servers:"
echo "  yarn dev              # Start both backend and frontend"
echo "  yarn dev:backend      # Start backend only (port 3001)"
echo "  yarn dev:frontend     # Start frontend only (port 3000)"
echo ""
echo "To open Prisma Studio (Database GUI):"
echo "  yarn db:studio"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "📖 For detailed setup instructions, see SETUP_GUIDE.md"
echo ""
