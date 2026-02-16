-- Migration: Add Multi-Business Support

-- 1. Create businesses table
create table public.businesses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for businesses
alter table public.businesses enable row level security;

create policy "Users can view own businesses."
  on businesses for select
  using ( auth.uid() = user_id );

create policy "Users can insert own businesses."
  on businesses for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own businesses."
  on businesses for update
  using ( auth.uid() = user_id );

create policy "Users can delete own businesses."
  on businesses for delete
  using ( auth.uid() = user_id );

-- 2. Add business_id to filtering tables

-- Daily Closures
alter table public.daily_closures 
add column business_id uuid references public.businesses(id);

-- Update RLS for Daily Closures to check business ownership (optional, mostly covered by user_id but good for data integrity)
-- existing policies check user_id which is fine.

-- Advances
alter table public.advances 
add column business_id uuid references public.businesses(id);

-- Deductions
alter table public.deductions 
add column business_id uuid references public.businesses(id);

-- 3. Data Migration (Optional / for Dev)
-- If we wanted to backfill existing data to a default business, we'd do it here.
-- For now, we assume the user will start fresh or manually fix old rows if valuable.
