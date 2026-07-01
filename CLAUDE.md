# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Panini 2026 Collection Tracker — a full-stack FIFA World Cup 2026 sticker collection manager for 5 people (Ivan, Ruy, Giovanni, Ruben, Andres). Monorepo with separate `frontend/` and `backend/` directories.

## Commands

### Frontend (`frontend/`)
```bash
npm run dev       # Vite dev server on port 5173 (proxies /api → localhost:3001)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

### Backend (`backend/`)
```bash
npm run dev       # node --watch src/index.js
npm run start     # node src/index.js
npm run db:migrate   # prisma migrate dev
npm run db:push      # prisma db push (sync schema without migration history)
npm run db:generate  # prisma generate (after schema changes)
```

## Architecture

### Stack
- **Frontend**: React 18 + Vite, no UI library, vanilla CSS
- **Backend**: Express 4 + Prisma 5, PostgreSQL (Supabase in prod)
- **Deployment**: Frontend on Vercel, backend on Railway

### Data Model
```
Person: id, name (unique)
PersonSticker: id, personId (FK), stickerId (String), count (Int)
  — composite unique on [personId, stickerId]
```

Sticker IDs use format `{TEAM_CODE}-{INDEX}` (e.g., `MEX-0`, `ARG-3`) or `FWC-{N}` for universal stickers. 393 total: 9 FWC + 32 teams × 12 stickers.

The 5 people are hardcoded and seeded on backend startup (`backend/src/index.js`). The same list is duplicated in `frontend/src/data.js` — keep them in sync manually when adding/removing people.

### API
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/state` | All collections — returns `{ "Ivan": { "MEX-0": 2, ... }, ... }` (count > 0 only) |
| PUT | `/api/sticker` | Upsert one sticker — `{ person, stickerId, count }` — count ≤ 0 deletes |
| POST | `/api/stickers/bulk` | Bulk upsert — `{ person, stickers: [{ id, count }] }` — uses Prisma transaction |

### Frontend State (`App.jsx`)
All state lives in `App.jsx` via `useState`. Pattern: optimistic update → API call. Helpers `apiPut()` and `apiBulk()` wrap fetch.

Three views:
- **Album**: Stickers with count ≥ 1 (owned); click toggles 0 ↔ 1
- **Dupes**: Excess copies (count > 1); increment/decrement buttons
- **Trades**: Computed matches — person A has dupes, person B has zero

`TeamGrid` (left panel) shows team buttons colored by flag palette; `AlbumPage` / `DupesPage` / `Trades` render in the right panel.

### Styling
Dark-theme CSS variables: `--bg`, `--line`, `--ink`, `--mint`, `--cyan`, `--warn`, `--danger`. Fonts: Inter (UI) + JetBrains Mono (sticker numbers).

### Environment
**Backend** (`.env`):
```
DATABASE_URL=postgresql://...
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`.env`): leave `VITE_API_URL` empty in dev (Vite proxy handles `/api`). Set to backend URL in production.
