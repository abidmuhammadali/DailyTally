create table shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('general_store', 'bakery', 'pharmacy')),
  created_at timestamptz not null default now()
);
create table daily_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  entry_date date not null,
  cash_amount numeric(12,2) not null check (cash_amount >= 0),
  online_amount numeric(12,2) not null check (online_amount >= 0),
  total_sale_amount numeric(12,2) check (total_sale_amount >= 0),
  created_at timestamptz not null default now(),
  unique (shop_id, entry_date)
);
create table expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  expense_date date not null,
  category text not null check (category in ('rent', 'bills', 'salary', 'restocking', 'other')),
  amount numeric(12,2) not null check (amount >= 0),
  note text,
  created_at timestamptz not null default now()
);
alter table shops enable row level security;
alter table daily_entries enable row level security;
alter table expenses enable row level security;

create policy "owners manage their own shops"
on shops for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "owners manage entries on their own shops"
on daily_entries for all
using (
  exists (select 1 from shops where shops.id = daily_entries.shop_id and shops.owner_id = auth.uid())
)
with check (
  exists (select 1 from shops where shops.id = daily_entries.shop_id and shops.owner_id = auth.uid())
);

create policy "owners manage expenses on their own shops"
on expenses for all
using (
  exists (select 1 from shops where shops.id = expenses.shop_id and shops.owner_id = auth.uid())
)
with check (
  exists (select 1 from shops where shops.id = expenses.shop_id and shops.owner_id = auth.uid())
);