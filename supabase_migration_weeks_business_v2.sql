-- Migration: Add Business ID to Weeks table to isolate them per business
-- Step 1: Add the column
ALTER TABLE public.weeks 
ADD COLUMN business_id uuid REFERENCES public.businesses(id);

-- Step 2: Update RLS policies to restrict checking by business_id (or user ownership via business)

-- Drop existing generic policy
DROP POLICY IF EXISTS "Weeks are viewable by everyone." ON public.weeks;

-- Create refined policies
CREATE POLICY "Users can view weeks for their businesses."
  ON public.weeks FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert weeks for their businesses."
  ON public.weeks FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete weeks for their businesses."
  ON public.weeks FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE user_id = auth.uid()
    )
  );
