-- 006_fix_admin_rls_policy.sql
-- Fix RLS policy after user_profiles table was dropped
-- Update get_user_role function to use auth.users app_metadata instead

-- Drop the old function that references non-existent table
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Create new function to get user role from auth.users app_metadata
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  roles_array text[];
BEGIN
  -- Get role from auth.users app_metadata
  SELECT COALESCE(
    (raw_app_meta_data->>'roles')::text[],
    ARRAY[]::text[]
  ) INTO roles_array
  FROM auth.users
  WHERE id = user_id;

  -- Get first role from array
  IF array_length(roles_array, 1) > 0 THEN
    user_role := roles_array[1];
  ELSE
    user_role := NULL;
  END IF;

  RETURN user_role;
END;
$$;

-- Update RLS policy for loyalty_points table
DROP POLICY IF EXISTS "Loyalty: admin can read all" ON public.loyalty_points;
CREATE POLICY "Loyalty: admin can read all"
ON public.loyalty_points FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Also update RLS policies for other tables that might need admin access
DROP POLICY IF EXISTS "Orders: admin can read all" ON public.orders;
CREATE POLICY "Orders: admin can read all"
ON public.orders FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Update loyalty_history table policy as well
DROP POLICY IF EXISTS "Loyalty History: admin can read all" ON public.loyalty_history;
CREATE POLICY "Loyalty History: admin can read all"
ON public.loyalty_history FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');