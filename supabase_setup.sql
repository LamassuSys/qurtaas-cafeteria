-- ================================================================
-- Qurtaas Ink & Drink — Supabase Database Setup
-- Run this entire script once in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → paste → Run
-- ================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────────────────────

-- App users (custom auth, not Supabase Auth)
create table if not exists app_users (
  id          uuid        primary key default uuid_generate_v4(),
  username    text        unique not null,
  full_name   text        not null,
  role        text        not null
              check (role in ('super_admin','admin','cashier','accountant','supply','barista')),
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  last_login  timestamptz
);

-- Passwords (plain-text to match current app behaviour)
create table if not exists app_passwords (
  username  text primary key
            references app_users(username) on update cascade on delete cascade,
  password  text not null
);

-- Global key-value settings (exchange rate, etc.)
create table if not exists app_settings (
  key   text primary key,
  value text not null
);

-- Menu categories
create table if not exists categories (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        unique not null,
  emoji      text        not null default '🏷️',
  color      text        not null default 'bg-gray-700 text-gray-300',
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

-- Menu items  (prices stored in IQD)
create table if not exists menu_items (
  id         uuid          primary key default uuid_generate_v4(),
  name       text          not null,
  category   text          not null
             references categories(name) on update cascade on delete restrict,
  price      numeric(12,0) not null check (price > 0),
  cost       numeric(12,0) not null check (cost >= 0),
  emoji      text          not null default '🍽️',
  active     boolean       not null default true,
  created_at timestamptz   not null default now()
);

-- Orders
create table if not exists orders (
  id            uuid          primary key default uuid_generate_v4(),
  order_number  integer       generated always as identity,
  customer_name text          not null default 'Walk-in',
  notes         text          not null default '',
  status        text          not null default 'pending'
                check (status in ('pending','preparing','ready','completed','cancelled')),
  total         numeric(12,0) not null default 0,
  created_by    text          not null,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

-- Order line items
create table if not exists order_items (
  id           uuid          primary key default uuid_generate_v4(),
  order_id     uuid          not null references orders(id) on delete cascade,
  menu_item_id text          not null,
  name         text          not null,
  emoji        text          not null default '🍽️',
  category     text          not null,
  price        numeric(12,0) not null,
  cost         numeric(12,0) not null,
  qty          integer       not null check (qty > 0)
);

-- Order status change log
create table if not exists order_status_history (
  id         uuid        primary key default uuid_generate_v4(),
  order_id   uuid        not null references orders(id) on delete cascade,
  status     text        not null,
  changed_by text        not null,
  changed_at timestamptz not null default now()
);

-- Historical transactions (seeded below; grows as orders complete)
create table if not exists transactions (
  id       text    primary key,
  date     date    not null,
  time     text    not null,
  item     text    not null,
  category text    not null,
  qty      integer not null,
  price    numeric not null,
  cost     numeric not null,
  revenue  numeric not null,
  profit   numeric not null,
  hour     integer not null
);

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- The app manages its own auth layer; anon key gets full access.
-- ──────────────────────────────────────────────────────────────
alter table app_users            enable row level security;
alter table app_passwords        enable row level security;
alter table app_settings         enable row level security;
alter table categories           enable row level security;
alter table menu_items           enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;
alter table transactions         enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='app_users'            and policyname='anon_all') then
    create policy "anon_all" on app_users            for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='app_passwords'        and policyname='anon_all') then
    create policy "anon_all" on app_passwords        for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='app_settings'         and policyname='anon_all') then
    create policy "anon_all" on app_settings         for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='categories'           and policyname='anon_all') then
    create policy "anon_all" on categories           for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='menu_items'           and policyname='anon_all') then
    create policy "anon_all" on menu_items           for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='orders'               and policyname='anon_all') then
    create policy "anon_all" on orders               for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='order_items'          and policyname='anon_all') then
    create policy "anon_all" on order_items          for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='order_status_history' and policyname='anon_all') then
    create policy "anon_all" on order_status_history for all using (true) with check (true); end if;
  if not exists (select 1 from pg_policies where tablename='transactions'         and policyname='anon_all') then
    create policy "anon_all" on transactions         for all using (true) with check (true); end if;
end $$;

-- ──────────────────────────────────────────────────────────────
-- REAL-TIME
-- ──────────────────────────────────────────────────────────────
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table order_status_history;
alter publication supabase_realtime add table menu_items;
alter publication supabase_realtime add table categories;

-- ──────────────────────────────────────────────────────────────
-- SEED DATA
-- ──────────────────────────────────────────────────────────────

-- Settings
insert into app_settings (key, value) values ('exchange_rate', '1310')
on conflict (key) do nothing;

-- Default users
insert into app_users (id, username, full_name, role, active) values
  ('a0000001-0000-0000-0000-000000000001','super_admin', 'Super Admin',    'super_admin', true),
  ('a0000001-0000-0000-0000-000000000002','admin',       'Store Manager',  'admin',       true),
  ('a0000001-0000-0000-0000-000000000003','cashier1',    'Layla Hassan',   'cashier',     true),
  ('a0000001-0000-0000-0000-000000000004','accountant1', 'Omar Farouk',    'accountant',  true),
  ('a0000001-0000-0000-0000-000000000005','supply1',     'Noor Ali',       'supply',      true),
  ('a0000001-0000-0000-0000-000000000006','barista1',    'Hana Yousef',    'barista',     true)
on conflict (username) do nothing;

insert into app_passwords (username, password) values
  ('super_admin', 'Admin@1234'),
  ('admin',       'Admin@1234'),
  ('cashier1',    'Cashier@1234'),
  ('accountant1', 'Acct@1234'),
  ('supply1',     'Supply@1234'),
  ('barista1',    'Barista@1234')
on conflict (username) do nothing;

-- Categories
insert into categories (name, emoji, color, sort_order) values
  ('Beverages','☕','bg-blue-500/20 text-blue-400',    1),
  ('Snacks',   '🍿','bg-amber-500/20 text-amber-400',  2),
  ('Healthy',  '🥗','bg-emerald-500/20 text-emerald-400',3),
  ('Desserts', '🍰','bg-pink-500/20 text-pink-400',    4),
  ('Mains',    '🍽️','bg-orange-500/20 text-orange-400',5)
on conflict (name) do nothing;

-- Menu items (IQD)
insert into menu_items (name, category, price, cost, emoji) values
  ('Coffee',   'Beverages',  3500, 800,  '☕'),
  ('Tea',      'Beverages',  2500, 400,  '🍵'),
  ('Juice',    'Beverages',  4000, 1000, '🍊'),
  ('Water',    'Beverages',  1500, 200,  '💧'),
  ('Sandwich', 'Snacks',     6000, 2000, '🥪'),
  ('Salad',    'Healthy',    7500, 2500, '🥗'),
  ('Cake',     'Desserts',   5000, 1500, '🍰'),
  ('Pasta',    'Mains',     10000, 3500, '🍝'),
  ('Burger',   'Mains',     10500, 3500, '🍔'),
  ('Pizza',    'Mains',     12000, 4500, '🍕')
on conflict do nothing;

-- ──────────────────────────────────────────────────────────────
-- HELPER: auto-update orders.updated_at on status change
-- ──────────────────────────────────────────────────────────────
create or replace function update_order_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function update_order_timestamp();
