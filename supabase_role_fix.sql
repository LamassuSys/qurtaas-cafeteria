-- ─────────────────────────────────────────────────────────────
--  Qurtaas — Fix supply_manager role
--  Run this ONCE in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Drop the old check constraint (name may vary — find it first)
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 2. Add the corrected constraint with 'supply_manager'
ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('super_admin','admin','cashier','accountant','supply_manager','barista'));

-- 3. Rename any existing 'supply' rows to 'supply_manager'
UPDATE app_users
  SET role = 'supply_manager'
  WHERE role = 'supply';
