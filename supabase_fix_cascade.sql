-- Add ON DELETE CASCADE to business foreign keys

-- 1. Daily Closures
ALTER TABLE public.daily_closures
DROP CONSTRAINT IF EXISTS daily_closures_business_id_fkey;

ALTER TABLE public.daily_closures
ADD CONSTRAINT daily_closures_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES public.businesses(id)
ON DELETE CASCADE;

-- 2. Advances
ALTER TABLE public.advances
DROP CONSTRAINT IF EXISTS advances_business_id_fkey;

ALTER TABLE public.advances
ADD CONSTRAINT advances_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES public.businesses(id)
ON DELETE CASCADE;

-- 3. Deductions
ALTER TABLE public.deductions
DROP CONSTRAINT IF EXISTS deductions_business_id_fkey;

ALTER TABLE public.deductions
ADD CONSTRAINT deductions_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES public.businesses(id)
ON DELETE CASCADE;
