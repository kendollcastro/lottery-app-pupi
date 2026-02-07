-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Linked to Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  name text,
  username text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. WEEKS (Global configuration, usually managed by admin)
create table public.weeks (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text default 'active' check (status in ('active', 'closed')),
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Weeks
alter table public.weeks enable row level security;

create policy "Weeks are viewable by everyone."
  on weeks for select
  using ( true );

-- Only admins should insert/update (simplified for now: allow authenticated if needed, or manual)
-- For now, let's allow authenticated users to read.

-- 3. DAILY CLOSURES
create table public.daily_closures (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  date date not null,
  sale_total numeric default 0,
  prizes_paid numeric default 0,
  commission_percentage numeric default 0.07,
  calculated_profit numeric generated always as ((sale_total - prizes_paid) + (sale_total * commission_percentage)) stored, -- Optional: stored or calculated views
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- RLS: Daily Closures
alter table public.daily_closures enable row level security;

create policy "Users can view own closures."
  on daily_closures for select
  using ( auth.uid() = user_id );

create policy "Users can insert own closures."
  on daily_closures for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own closures."
  on daily_closures for update
  using ( auth.uid() = user_id );

-- 4. ADVANCES
create table public.advances (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amount numeric not null,
  reason text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Advances
alter table public.advances enable row level security;

create policy "Users can view own advances."
  on advances for select
  using ( auth.uid() = user_id );

create policy "Users can insert own advances."
  on advances for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own advances."
  on advances for update
  using ( auth.uid() = user_id );

create policy "Users can delete own advances."
  on advances for delete
  using ( auth.uid() = user_id );

-- 5. DEDUCTIONS
create table public.deductions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amount numeric not null,
  reason text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Deductions
alter table public.deductions enable row level security;

create policy "Users can view own deductions."
  on deductions for select
  using ( auth.uid() = user_id );

create policy "Users can insert own deductions."
  on deductions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own deductions."
  on deductions for update
  using ( auth.uid() = user_id );

create policy "Users can delete own deductions."
  on deductions for delete
  using ( auth.uid() = user_id );

-- 6. Trigger to create Profile on Signup
-- This automatically creates a profile entry when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, role)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. SEED DATA (Optional, for initial testing)
-- Insert a default active week starting today
insert into public.weeks (name, start_date, end_date, status)
values (
  'Semana Actual',
  current_date,
  current_date + interval '6 days',
  'active'
);
