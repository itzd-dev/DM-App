-- Orders table
create table if not exists public.orders (
  id text primary key, -- e.g. 'DM-123456'
  customer text,
  customer_email text,
  items jsonb not null default '[]'::jsonb,
  total integer not null,
  status text not null default 'Menunggu Pembayaran',
  discount jsonb,
  date date,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Allow read to anon'
  ) then
    create policy "Allow read to anon" on public.orders for select using (true);
  end if;
end $$;

-- Promotions table
create table if not exists public.promotions (
  code text primary key,
  discount numeric not null, -- percentage: 0.1, fixed: 5000
  type text not null check (type in ('percentage','fixed'))
);

alter table public.promotions enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'promotions' and policyname = 'Allow read to anon'
  ) then
    create policy "Allow read to anon" on public.promotions for select using (true);
  end if;
end $$;

