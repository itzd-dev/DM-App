-- Helper function to get a user's role from their user_id
-- This is needed to check for 'admin' role within RLS policies.
create or replace function public.get_user_role(user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  role text;
begin
  select p.role into role from public.user_profiles p where p.id = user_id;
  return role;
end;
$$;

-- New RLS policy for admins on loyalty_points table
-- This allows users with the 'admin' role to read all rows.
create policy "Loyalty: admin can read all" 
on public.loyalty_points for select
to authenticated
using (public.get_user_role(auth.uid()) = 'admin');
