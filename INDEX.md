# Project Structure

```
backend/          NestJS API (port 3001)
  src/            Source code (modules/, common/)
  prisma/         Schema + migrations
web/              Next.js frontend (port 3000)
  src/app/        App Router pages
  src/services/   API service layer
  src/hooks/      React hooks
mobile/           Flutter mobile app
scripts/          Launcher scripts (.bat)
openspec/         Specifications and change history
```

## Key Commands

```bash
# Backend
cd backend && npm run dev          # Start dev server (port 3001)
cd backend && npm test             # Run Jest tests
cd backend && npm run lint         # Lint

# Frontend
cd web && npm run dev              # Start dev server (port 3000)
cd web && npm run build            # Production build
cd web && npm run lint             # Lint

# Database
cd backend && npx prisma migrate dev --name <name>   # Create migration
cd backend && npx prisma generate                     # Regenerate client
cd backend && npm run db:seed                         # Seed sample data
cd backend && npx prisma studio                       # Visual DB browser

# Docker
docker compose up -d postgres      # Start PostgreSQL
docker compose --profile tools up -d pgadmin  # Start pgAdmin

# Scripts (Windows)
scripts/launcher.bat               # Interactive menu
scripts/start-web.bat              # Start all services (local)
scripts/start-web-lan.bat          # Start all services (LAN accessible)
scripts/stop-all.bat               # Stop everything
```
