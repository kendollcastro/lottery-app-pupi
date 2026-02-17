-- Fix Daily Closures Unique Constraint

-- 1. Drop the old unique constraint (likely on user_id, date)
-- We try to drop common names, or just the one we likely created.
ALTER TABLE public.daily_closures
DROP CONSTRAINT IF EXISTS daily_closures_user_id_date_key;

-- 2. Add the new unique constraint including business_id
ALTER TABLE public.daily_closures
ADD CONSTRAINT daily_closures_business_date_unique UNIQUE (user_id, business_id, date);
