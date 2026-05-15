-- ─────────────────────────────────────────────────────────────
--  Qurtaas — Fix supply_manager role
--  Run this ONCE in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Rename existing 'supply' rows FIRST (before touching the constraint)
UPDATE app_users
  SET role = 'supply_manager'
  WHERE role = 'supply';

-- 2. Drop the old check constraint
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 3. Add the corrected constraint that includes 'supply_manager'
ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('super_admin','admin','cashier','accountant','supply_manager','barista'));
