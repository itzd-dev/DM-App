-- This migration cleans up user-related tables and RLS policies.

-- Step 1: Drop the user_profiles table as it is redundant.
-- User data should be sourced from auth.users and custom claims/metadata.
DROP TABLE IF EXISTS public.user_profiles;

-- Step 2: Drop RLS policies that depend on get_user_role(uuid) before dropping the function.
DROP POLICY IF EXISTS "Loyalty: read own" ON public.loyalty_points;
DROP POLICY IF EXISTS "Loyalty: admin can read all" ON public.loyalty_points;

-- Step 3: Drop the helper function that depended on user_profiles.
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Step 4: Update the RLS policy on loyalty_points to use app_metadata.
-- This requires a new helper function to extract the role from the JWT.
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TEXT AS $$
  SELECT COALESCE((auth.jwt()->>'app_metadata')::jsonb->>'role', 'buyer');
$$ LANGUAGE sql STABLE;

-- Step 5: Recreate the policy with the new function
CREATE POLICY "Loyalty: read own or admin read all" ON public.loyalty_points
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR (public.get_my_role() = 'admin')
);