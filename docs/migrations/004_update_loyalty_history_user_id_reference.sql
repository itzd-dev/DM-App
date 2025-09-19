-- 004_update_loyalty_history_user_id_reference.sql

-- Drop the existing foreign key constraint
ALTER TABLE public.loyalty_history
DROP CONSTRAINT IF EXISTS loyalty_history_user_id_fkey;

-- Add the new foreign key constraint referencing loyalty_points(id)
ALTER TABLE public.loyalty_history
ADD CONSTRAINT loyalty_history_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.loyalty_points(id) ON DELETE CASCADE;