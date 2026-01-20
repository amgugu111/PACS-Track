# PACS-Track - Rice Miller PACS SaaS

A comprehensive Gate Entry Management System for Rice Miller PACS (Primary Agricultural Credit Society).

## 🏗️ Monorepo Structure

```
pacs-track/
├── apps/
│   ├── backend/          # NestJS API Server
│   └── frontend/         # Next.js Web Application
├── packages/
│   ├── database/         # Prisma Schema & Client
│   └── shared-types/     # Shared TypeScript Types
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- PostgreSQL 14+ (or your preferred database)

### Installation

```bash
# Install dependencies
yarn install

# Setup database
yarn db:generate
yarn db:push

# Start development servers
yarn dev
```

The backend will run on `http://localhost:3001` and frontend on `http://localhost:3000`.

## 📦 Packages

### @pacs-track/backend
NestJS backend with:
- Gate Entry API with smart farmer upsert
- Society and District management
- Real-time validation

### @pacs-track/frontend
Next.js frontend with:
- MUI components
- Smart farmer autocomplete (freeSolo)
- Auto-calculated fields
- District auto-fill

### @pacs-track/database
Prisma schema with:
- GatePassEntry model
- Society, Farmer, District models
- Relationships and constraints

## 🎯 Key Features

### Gate Entry Module
- **Token Number**: Manual gatepass number (unique)
- **Smart Farmer Entry**: Search existing or create new farmers on-the-fly
- **Auto-calculations**: Qty per bag computed in real-time
- **District Auto-fill**: Automatically populated based on selected society
- **Date Picker**: Defaults to today, fully editable

## 📝 Scripts

- `yarn dev` - Start all development servers
- `yarn build` - Build all packages
- `yarn db:generate` - Generate Prisma client
- `yarn db:push` - Push schema changes to database
- `yarn db:migrate` - Run migrations
- `yarn db:studio` - Open Prisma Studio

## 🔧 Configuration

Create `.env` files in appropriate packages:

**packages/database/.env**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pacs_track"
```

**apps/backend/.env**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pacs_track"
PORT=3001
```

**apps/frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📄 License

MIT
