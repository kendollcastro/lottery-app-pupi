-- Migration: Add DELETE policies for cleanup
-- Allow users to delete their own closures (needed for zombie data cleanup)
CREATE POLICY "Users can delete own closures."
  ON public.daily_closures FOR DELETE
  USING ( auth.uid() = user_id );

-- Advances already had a delete policy in schema.sql, but let's ensure it's there or recreate if needed.
-- Schema line 102: create policy "Users can delete own advances." ... so that's fine.

-- Deductions already had a delete policy in schema.sql.
-- Schema line 131: create policy "Users can delete own deductions." ... so that's fine.

-- Re-verify Business ID on DELETE for daily_closures just in case
-- The logic in api.ts uses .eq('business_id', ...) which is good, but RLS must allow the row deletion based on user_id.
-- The above policy covers it.

-- Optional: Add index on business_id for performance since we filter by it a lot now
CREATE INDEX IF NOT EXISTS idx_daily_closures_business_id ON public.daily_closures(business_id);
CREATE INDEX IF NOT EXISTS idx_advances_business_id ON public.advances(business_id);
CREATE INDEX IF NOT EXISTS idx_deductions_business_id ON public.deductions(business_id);
CREATE INDEX IF NOT EXISTS idx_weeks_business_id ON public.weeks(business_id);
