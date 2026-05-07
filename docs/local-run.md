# Run locally

You need two terminals — one for the backend, one for the frontend.

---

## 1. Create the database

You already have PostgreSQL running in Docker. Connect to it and create the database:

```bash
docker exec -it <your-postgres-container-name> psql -U postgres -c "CREATE DATABASE panini_tracker;"
```

To find your container name:
```bash
docker ps
```

---

## 2. Configure the backend .env

Edit `app/backend/.env` and set your actual Postgres password:

```env
DATABASE_URL="postgresql://postgres:<your-password>@localhost:5432/panini_tracker"
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

The file already exists — just update the password in the `DATABASE_URL`.

---

## 3. Run Prisma migrations

From the `app/backend` directory:

```bash
cd app/backend
npx prisma migrate dev --name init
```

This does three things:
1. Reads the schema in `prisma/schema.prisma`
2. Creates a migration file under `prisma/migrations/`
3. Applies it to your local database (creates the `Person` and `PersonSticker` tables)

If you just want to push the schema without creating migration files (simpler for local iteration):
```bash
npx prisma db push
```

---

## 4. Start the backend

```bash
# Still in app/backend
npm run dev
```

You should see:
```
API running on http://localhost:3001
```

The server auto-seeds the 5 people (Ivan, Ruy, Giovanni, Ruben, Andres) on first startup.

Verify it's working:
```bash
curl http://localhost:3001/api/state
# → {"Ivan":{},"Ruy":{},"Giovanni":{},"Ruben":{},"Andres":{}}
```

---

## 5. Start the frontend

Open a second terminal:

```bash
cd app/frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The Vite dev server proxies all `/api/*` requests to `:3001` automatically — no extra config needed.

---

## Prisma helper commands

```bash
# Open Prisma Studio (visual DB browser) — useful for inspecting data
npx prisma studio

# Reset the database and re-run all migrations from scratch
npx prisma migrate reset

# Generate the Prisma client after schema changes (done automatically by migrate dev)
npx prisma generate

# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name describe_your_change
```
