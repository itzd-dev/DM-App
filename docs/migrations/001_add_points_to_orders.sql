-- Add points_discount and points_redeemed to orders table

ALTER TABLE public.orders
ADD COLUMN points_discount INTEGER DEFAULT 0,
ADD COLUMN points_redeemed INTEGER DEFAULT 0;
