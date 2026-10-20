-- Run once in pgAdmin: connect to server PostgreSQL 18, open Query Tool on database "gstc".
-- Uses a dedicated app user (password must match DATABASE_URL in .env).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gstc') THEN
    CREATE ROLE gstc LOGIN PASSWORD 'gstc_local_2026';
  ELSE
    ALTER ROLE gstc LOGIN PASSWORD 'gstc_local_2026';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE gstc TO gstc;
GRANT ALL ON SCHEMA public TO gstc;
GRANT CREATE ON SCHEMA public TO gstc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gstc;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gstc;
