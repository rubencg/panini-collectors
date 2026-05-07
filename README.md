# Panini 2026 Collection Tracker

A sticker collection manager for the FIFA World Cup 2026 Panini album. Tracks which stickers each of 5 collectors (Ivan, Ruy, Giovanni, Ruben, Andres) owns, which ones are duplicates, and suggests trades between collectors.

## What it does

- **Album view** — mark stickers as owned/missing across all 32 teams + universal FWC stickers
- **Dupes view** — track how many extra copies each person has
- **Trades view** — automatically find trade opportunities between collectors (one has dupes, the other is missing)

## Running locally

You need two terminals — one for the backend, one for the frontend.

### Prerequisites

- Node.js
- PostgreSQL running (Docker recommended)

### Quick start

1. Create the database:
   ```bash
   docker exec -it <your-postgres-container> psql -U postgres -c "CREATE DATABASE panini_tracker;"
   ```

2. Configure `app/backend/.env` with your database password:
   ```env
   DATABASE_URL="postgresql://postgres:<your-password>@localhost:5432/panini_tracker"
   PORT=3001
   CORS_ORIGIN=http://localhost:5173
   ```

3. Run migrations and start the backend:
   ```bash
   cd app/backend
   npx prisma migrate dev --name init
   npm run dev
   ```

4. Start the frontend in a second terminal:
   ```bash
   cd app/frontend
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173).

For full setup details, Prisma helper commands, and troubleshooting, see [docs/local-run.md](docs/local-run.md).
