# GSTC Assessment

A private workspace for recording an organization’s sustainability checklist. One account owns one organization. Sections A–D come from `CHECKLIST (3).xlsx`.

## Project structure

Frontend UI and backend server code are separate folders. Next.js `app/` routes connect them.

```
frontend/     React UI — components, styles, client helpers
backend/      Server — Prisma, auth, APIs, server actions, scripts
app/          Next.js routes only (pages import frontend UI + backend data)
public/       Static files (Next.js requires this at the project root)
```

- **Frontend** lives in `frontend/components` and `frontend/lib`.
- **Backend** lives in `backend/` (`prisma`, `actions`, `api`, `auth.ts`, `lib`, `queries`, `scripts`).
- `app/api/*` files are thin re-exports of `backend/api/*`.

## Run locally

### 1. PostgreSQL

Use your own Postgres server, or start one with Docker:

```bash
docker compose up -d
```

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — e.g. `postgresql://gstc:gstc@localhost:5432/gstc?schema=public`
- `AUTH_SECRET` — a long random string

### 2. App

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000.

**Note:** The app uses **PostgreSQL** (not SQLite). Existing `prisma/dev.db` data is not migrated automatically; create users again or export/import manually if needed.

### Admin and managed users

Create an **admin** account (can add users in the app and edit their email/password):

```bash
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

Public self-sign-up is **off** by default (clients only get accounts you create). To allow `/signup` for testing, set `PUBLIC_SIGNUP=true` in `.env`.

Uploaded files are stored in `storage/` and are not public. Answers are kept in PostgreSQL.
