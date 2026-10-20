# Sustainable Hospitality Impact

A private workspace for recording an organization’s sustainability checklist. One account owns one organization. Sections A–D come from `CHECKLIST (3).xlsx`.

Frontend UI deploys to Vercel. PostgreSQL, Prisma migrations, and CLI user tools run on the Cipher Labz company server. Next.js Route Handlers and Server Actions currently stay with the frontend so login, uploads, and reports keep working without an API rewrite.

## Project structure

```
frontend/     Next.js app (Vercel Root Directory)
backend/      Prisma schema, auth, server actions, API handlers, CLI scripts
storage/      Uploaded evidence and logos (not public)
```

- **Frontend** (`frontend/`): `app/` routes, React UI, styles, and static files. Independently installable for Vercel.
- **Backend** (`backend/`): Prisma, Auth.js, server actions, `/api` handlers, and admin CLI. Imported by the Next.js app; CLI scripts run on the company server.
- `frontend/app/api/*` files are thin re-exports of `backend/api/*`.

## Run locally

### 1. PostgreSQL

Use your own Postgres server, or start one with Docker:

```bash
docker compose up -d
```

Copy `frontend/.env.example` to `frontend/.env` and `backend/.env.example` to `backend/.env`. Set:

- `DATABASE_URL` — e.g. `postgresql://gstc:gstc@localhost:5432/gstc?schema=public`
- `AUTH_SECRET` — a long random string (frontend)

Keep `STORAGE_ROOT="../storage"` so uploads stay in the repo-root `storage/` folder.

### 2. Backend (database)

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

PDF export needs Chrome. After `npm install` in `frontend/`, run `npm run browsers:install` if reports fail to generate.

From the repo root you can also run `npm run dev`, `npm run db:migrate`, and `npm run db:seed` after installing each package once.

**Note:** The app uses **PostgreSQL** (not SQLite). Existing `prisma/dev.db` data is not migrated automatically; create users again or export/import manually if needed.

### Admin and managed users

Create an **admin** account (can add users in the app and edit their email/password):

```bash
cd backend
npm run user:create -- admin@example.com "AdminPassword123" --admin
```

Or promote an existing account:

```bash
npm run user:admin -- admin@example.com
```

Sign in, then open **Users** in the top navigation (`/admin/users`). Managed users sign in with the email and password you set and **cannot** change their password in My Space.

CLI-only provisioned user (no admin UI):

```bash
npm run user:create -- user@example.com "their-password"
```

Public self-sign-up is **off** by default (clients only get accounts you create). To allow `/signup` for testing, set `PUBLIC_SIGNUP=true` in `frontend/.env`.

Uploaded files are stored in `storage/` and are not public. Answers are kept in PostgreSQL.

## Production

### Vercel (frontend)

- Root Directory: `frontend`
- Framework Preset: Next.js
- Install / build / output: leave as Next.js defaults
- Include files outside the Root Directory in the build (the app imports `../backend`)

Environment variables are listed in `frontend/.env.example`.

### Company server (database and CLI)

- Host PostgreSQL (see `docker-compose.yml` for a local equivalent)
- Run `backend` install + `npm run db:migrate` (and `db:seed` when needed)
- Point the Vercel `DATABASE_URL` at this database over TLS
