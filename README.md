# Sustainable Hospitality Impact

A private workspace for recording an organization’s sustainability checklist. One account owns one organization. Sections A–D come from `CHECKLIST (3).xlsx`.

Frontend UI deploys to Vercel. PostgreSQL, Prisma migrations, CLI user tools, and a Fastify HTTP skeleton run on the Cipher Labz company server. Next.js Route Handlers, Auth.js, and Server Actions still stay with the frontend, so login, uploads, and reports keep working without an API rewrite.

Auth, uploads, and reports are frozen on the Next.js app until later migration phases. The Fastify process currently exposes `/health`, `/ready`, and `GET /v1/auth/csrf` only. The API contract is `backend/openapi/v1.yaml`.

## Project structure

```
frontend/     Next.js app (Vercel Root Directory)
backend/      Fastify skeleton, Prisma, services, Auth.js actions, CLI scripts
storage/      Uploaded evidence and logos (not public)
```

- **Frontend** (`frontend/`): `app/` routes, React UI, styles, and static files. Independently installable for Vercel.
- **Backend** (`backend/`): Fastify server, Prisma, reusable services, Auth.js, server actions, `/api` handlers, and admin CLI. The Next.js app still imports `backend/` as a library.
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
- Optional Fastify values in `backend/.env`: `HOST=127.0.0.1`, `PORT=4000`, `CORS_ORIGINS=http://localhost:3000`

Keep `STORAGE_ROOT="../storage"` so uploads stay in the repo-root `storage/` folder.

### 2. Backend (database and Fastify skeleton)

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
```

The Next.js app does not call Fastify yet. To run the API process locally:

```bash
cd backend
npm run dev
```

Open http://127.0.0.1:4000/health. From the repo root you can also run `npm run dev:api` and `npm run verify:server`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

PDF export needs Chrome. After `npm install` in `frontend/`, run `npm run browsers:install` if reports fail to generate.

From the repo root you can also run `npm run dev`, `npm run dev:api`, `npm run db:migrate`, and `npm run db:seed` after installing each package once.

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
- Node.js Version: 22.x (`frontend/.nvmrc`; required by `@sparticuz/chromium`)
- Install / build / output: leave as Next.js defaults (`frontend/vercel.json` sets the install command)
- Include files outside the Root Directory in the build (the app imports `../backend`)

Required environment variables (names only; set values in the Vercel project):

- `DATABASE_URL` — PostgreSQL connection string (used at runtime, not to migrate during build)
- `AUTH_SECRET` — Auth.js session signing secret
- `AUTH_URL` — canonical site URL, e.g. `https://your-frontend-domain.com`
- `NEXT_PUBLIC_APP_URL` — same public site URL, used for share links

Optional:

- `PUBLIC_SIGNUP` — set to `true` only if `/signup` should be public
- `STORAGE_ROOT` — upload directory; the Vercel filesystem is ephemeral
- `PUPPETEER_EXECUTABLE_PATH` — local/server Chrome path; leave unset on Vercel

Environment variable templates are in `frontend/.env.example`.

### Company server (database, CLI, Fastify)

- Host PostgreSQL (see `docker-compose.yml` for a local equivalent)
- Run `backend` install + `npm run db:migrate` (and `db:seed` when needed)
- Compile and run Fastify with `npm run build` then `npm start` (listens on `127.0.0.1:4000` by default)
- Fastify should stay on `127.0.0.1` behind nginx TLS once later phases land
- Until the API cutover, point the Vercel `DATABASE_URL` at this database over TLS so the current Next.js app keeps working
