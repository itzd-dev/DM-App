-- products table: aligns with the app's data shape
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  price integer not null,
  category text,
  image text,
  description text,
  featured boolean default false,
  tags text[] default '{}'::text[],
  allergens text[] default '{}'::text[],
  rating numeric(3,1) default 0.0,
  review_count integer default 0,
  sold_count integer default 0,
  is_available boolean default true,
  current_stock integer default 0,
  stock_history jsonb default '[]'::jsonb
);

-- Optional helpful indexes
create index if not exists products_category_idx on public.products (category);
create index if not exists products_featured_idx on public.products (featured);

-- Enable RLS and allow public read (anon); restrict writes to server (service role)
alter table public.products enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'Allow read to anon'
  ) then
    create policy "Allow read to anon" on public.products for select using (true);
  end if;
end $$;

-- Note: Service Role key (used in Vercel serverless functions) bypasses RLS, so no write policy is necessary for public role.

