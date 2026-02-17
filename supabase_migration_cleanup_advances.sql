-- Ensure DELETE permissions are clear for ALL related tables
-- The previous step fixed closures, now we verify advances and deductions.

-- 1. Advances
DROP POLICY IF EXISTS "Users can delete own advances." ON public.advances;
CREATE POLICY "Users can delete own advances."
  ON public.advances FOR DELETE
  USING ( auth.uid() = user_id );

-- 2. Deductions
DROP POLICY IF EXISTS "Users can delete own deductions." ON public.deductions;
CREATE POLICY "Users can delete own deductions."
  ON public.deductions FOR DELETE
  USING ( auth.uid() = user_id );

-- 3. Just in case: Grant DELETE permissions if they were somehow revoked (unlikely but possible in some setups)
GRANT DELETE ON public.advances TO authenticated;
GRANT DELETE ON public.deductions TO authenticated;
GRANT DELETE ON public.daily_closures TO authenticated;
GRANT DELETE ON public.weeks TO authenticated;
