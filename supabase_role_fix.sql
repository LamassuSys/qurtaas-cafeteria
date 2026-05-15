-- ─────────────────────────────────────────────────────────────
--  Qurtaas — Fix supply_manager role
--  Run this ONCE in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Drop the old constraint FIRST (it blocks the update)
ALTER TABLE app_users
  DROP CONSTRAINT IF EXISTS app_users_role_check;

-- 2. Now safely rename 'supply' → 'supply_manager'
UPDATE app_users
  SET role = 'supply_manager'
  WHERE role = 'supply';

-- 3. Add the corrected constraint
ALTER TABLE app_users
  ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('super_admin','admin','cashier','accountant','supply_manager','barista'));
