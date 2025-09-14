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

-- Sequential DM-xxxxx order IDs starting at DM-00001
do $$ begin
  if not exists (
    select 1 from pg_class where relname = 'order_seq'
  ) then
    create sequence public.order_seq start 1;
  end if;
end $$;

create or replace function public.set_order_id()
returns trigger as $$
begin
  if new.id is null or new.id = '' then
    new.id := 'DM-' || to_char(nextval('public.order_seq'), 'FM00000');
  end if;
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'orders_set_id'
  ) then
    create trigger orders_set_id
    before insert on public.orders
    for each row execute function public.set_order_id();
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

-- Partners table
create table if not exists public.partners (
  id bigint generated always as identity primary key,
  name text not null,
  contact text,
  notes text
);

alter table public.partners enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'partners' and policyname = 'Allow read to anon'
  ) then
    create policy "Allow read to anon" on public.partners for select using (true);
  end if;
end $$;

-- Loyalty Points table
create table if not exists public.loyalty_points (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  points integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.loyalty_points enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'loyalty_points' and policyname = 'Loyalty: read own'
  ) then
    create policy "Loyalty: read own" on public.loyalty_points for select using (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'loyalty_points' and policyname = 'Loyalty: upsert own'
  ) then
    create policy "Loyalty: upsert own" on public.loyalty_points for insert with check (auth.uid() = id);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'loyalty_points' and policyname = 'Loyalty: update own'
  ) then
    create policy "Loyalty: update own" on public.loyalty_points for update using (auth.uid() = id);
  end if;
end $$;
