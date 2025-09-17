-- Import guide for docs/user_profiles_seed.csv
-- CSV columns: email,name,role
-- This script upserts into public.user_profiles by mapping email -> auth.users.id

-- Create a temporary table for the CSV (run only once)
create table if not exists public.user_profiles_seed (
  email text,
  name text,
  role text
);

-- After uploading the CSV into this seed table via Table Editor → Import,
-- run the merge below to upsert into user_profiles.

insert into public.user_profiles (id, email, name, role)
select u.id, s.email, s.name, s.role
from public.user_profiles_seed s
join auth.users u on lower(u.email) = lower(s.email)
on conflict (id) do update
  set email = excluded.email,
      name  = excluded.name,
      role  = excluded.role;

-- Optional: clean up seed table rows after successful import
-- truncate table public.user_profiles_seed;

