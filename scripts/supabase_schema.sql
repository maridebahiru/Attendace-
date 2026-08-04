-- ====================================================================
-- SUPABASE SCHEMA & ROW LEVEL SECURITY (RLS) FOR USER SCANNER FEATURE
-- ====================================================================

-- 1. Create users table synced from Google Form registrations
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  form_id text, -- ID entered by user on Google Form (phone number / generated)
  name text not null,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin', 'superadmin')),
  phone text,
  christian_name text,
  education text,
  work text,
  church text,
  is_sunday_student text,
  id_photo_url text,
  hear_from text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter table statements to ensure existing tables have all columns
alter table public.users add column if not exists phone text;
alter table public.users add column if not exists christian_name text;
alter table public.users add column if not exists education text;
alter table public.users add column if not exists work text;
alter table public.users add column if not exists church text;
alter table public.users add column if not exists is_sunday_student text;
alter table public.users add column if not exists id_photo_url text;
alter table public.users add column if not exists hear_from text;

-- Index for lookup performance
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_form_id on public.users(form_id);

-- 2. Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- 3. Security Definer Helper Function to avoid recursive RLS lookup loops
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid() limit 1;
$$;

-- 4. RLS POLICIES

-- SELECT POLICY: Users can read own profile; Admins & Superadmins can read all
create policy "Users can read own profile; Admins & Superadmins can read all"
  on public.users
  for select
  to authenticated
  using (
    auth.uid() = id OR public.get_my_role() in ('admin', 'superadmin')
  );

-- INSERT POLICY: Superadmins or initial bulk import
create policy "Superadmins can insert user records"
  on public.users
  for insert
  to authenticated
  with check (
    public.get_my_role() = 'superadmin' OR auth.uid() = id
  );

-- UPDATE POLICY: Only Superadmins can update users or change roles
create policy "Only Superadmins can edit users or promote/demote"
  on public.users
  for update
  to authenticated
  using (
    public.get_my_role() = 'superadmin'
  )
  with check (
    public.get_my_role() = 'superadmin'
  );

-- DELETE POLICY: Only Superadmins can delete users
create policy "Only Superadmins can delete users"
  on public.users
  for delete
  to authenticated
  using (
    public.get_my_role() = 'superadmin'
  );
