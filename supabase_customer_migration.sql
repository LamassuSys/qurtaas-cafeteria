-- ─────────────────────────────────────────────────────────────
--  Qurtaas — Customer Portal Migration
--  Run this ONCE in Supabase SQL Editor after supabase_setup.sql
-- ─────────────────────────────────────────────────────────────

-- 1. Add table_number to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS table_number INT;

-- 2. Customer accounts table
CREATE TABLE IF NOT EXISTS customers (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL UNIQUE,
  pin        TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS — open anon policy (app manages its own auth)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'anon_all'
  ) THEN
    CREATE POLICY "anon_all" ON customers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
