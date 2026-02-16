-- 1. Promover a ADMIN (Asegurar que tu usuario lo sea)
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'kendollcastrom@gmail.com'
);

-- 2. Limpiar Políticas Antiguas de SEMANAS (Para evitar conflictos)
DROP POLICY IF EXISTS "Weeks are viewable by everyone." ON public.weeks;
DROP POLICY IF EXISTS "Admins can insert weeks." ON public.weeks;
DROP POLICY IF EXISTS "Admins can update weeks." ON public.weeks;
DROP POLICY IF EXISTS "Admins can delete weeks." ON public.weeks;

-- 3. Crear Políticas "Super Admin" para SEMANAS
-- Lectura: Todo el mundo
CREATE POLICY "Weeks are viewable by everyone" ON public.weeks FOR SELECT USING (true);

-- Escritura: Solo Admins
CREATE POLICY "Admins can insert weeks" ON public.weeks FOR INSERT WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update weeks" ON public.weeks FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete weeks" ON public.weeks FOR DELETE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);


-- 4. Opcional: Políticas para ver DATA de OTROS usuarios (Supervisión)
-- Permitir a Admins ver todos los cierres, adelantos y deducciones
CREATE POLICY "Admins can view all closures" ON public.daily_closures FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can view all advances" ON public.advances FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can view all deductions" ON public.deductions FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
