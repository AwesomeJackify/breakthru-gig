-- Stores each member's completed 12-week programme onboarding form.
-- Run this in the Supabase SQL editor before deploying the feature.
create table if not exists public.programme_onboarding (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  order_reference text,
  name text not null,
  email text not null,
  age integer not null check (age between 16 and 99),
  experience text not null,
  goal text not null,
  context text not null,
  status text not null default 'submitted' check (status in ('submitted', 'in_progress', 'delivered')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.programme_onboarding enable row level security;

create policy "Members can read their own programme onboarding"
  on public.programme_onboarding for select
  using (auth.uid() = user_id);
