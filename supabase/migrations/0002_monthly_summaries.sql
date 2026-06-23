create table monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  month date not null,
  total_revenue numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique (shop_id, month)
);

alter table monthly_summaries enable row level security;

create policy "owners manage their own monthly summaries"
on monthly_summaries for all
using (
  exists (select 1 from shops where shops.id = monthly_summaries.shop_id and shops.owner_id = auth.uid())
)
with check (
  exists (select 1 from shops where shops.id = monthly_summaries.shop_id and shops.owner_id = auth.uid())
);

grant select, insert, update, delete on public.monthly_summaries to authenticated;