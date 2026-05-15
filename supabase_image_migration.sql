-- ─────────────────────────────────────────────────────────────
--  Qurtaas — Add image_url column to menu_items
--  Run this ONCE in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;
