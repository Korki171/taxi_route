-- Supabase stellt das Schema "public" über die Data API (REST/GraphQL) bereit. Wer den öffentlichen
-- Projektschlüssel kennt, spricht dort als Rolle "anon" bzw. "authenticated". TaxiRoute greift nur
-- serverseitig über Prisma (Tabelleneigentümer) zu, daher:
--   1. Row Level Security auf allen Tabellen ohne Policies: über die Data API ist nichts lesbar.
--   2. Rechte von anon/authenticated entziehen, auch für künftige Tabellen.
-- Auf anderen Postgres-Servern gibt es diese Rollen nicht; dann greift nur Schritt 1, der den
-- Tabelleneigentümer nicht einschränkt.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
  END IF;
END $$;
