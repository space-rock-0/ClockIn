-- ClockIn database bootstrap
-- Run this entire file once in Supabase Dashboard -> SQL Editor.
-- It is idempotent and can safely be run again after a project reset.

create extension if not exists pgcrypto;

-- Core application tables.  The quoted names are intentional: the backend
-- uses these existing CamelCase names through the Supabase REST API.
create table if not exists public."Tasks" (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text,
    importance integer,
    difficulty integer,
    priority integer,
    task_duration integer,
    due_date timestamptz,
    status text not null default 'to do',
    can_schedule boolean not null default false,
    is_complete boolean not null default false,
    color text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public."StickyNotes" (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default '',
    text text not null default '',
    color text not null default 'yellow',
    "posX" integer not null default 0,
    "posY" integer not null default 0,
    "posZ" integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public."BusyTimes" (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    start_time text,
    end_time text,
    days_of_week text[] not null default '{}',
    source text not null default 'manual',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public."TimerSession" (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_id uuid references public."Tasks"(id) on delete set null,
    mode text not null,
    started_at timestamptz not null,
    ended_at timestamptz not null,
    elapsed_seconds integer not null default 0,
    active_seconds integer not null default 0,
    task_completed boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public."Plants" (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    stage integer not null default 1,
    progress_seconds integer not null default 0,
    is_active boolean not null default true,
    variety text not null,
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create table if not exists public.user_visits (
    id uuid primary key references auth.users(id) on delete cascade,
    visited_home boolean not null default false,
    visited_notes boolean not null default false,
    visited_tasks boolean not null default false,
    visited_schedule boolean not null default false,
    visited_timer boolean not null default false,
    visited_garden boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Scheduling and learning tables.
create table if not exists public.schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_id uuid not null references public."Tasks"(id) on delete cascade,
    scheduled_start timestamptz not null,
    scheduled_end timestamptz not null,
    created_at timestamptz not null default now()
);

create table if not exists public.user_behavior_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    task_id uuid not null references public."Tasks"(id) on delete cascade,
    slot_offered timestamptz not null,
    action text not null check (action in ('accepted', 'rescheduled', 'ignored')),
    priority_norm double precision,
    urgency_norm double precision,
    duration_fit double precision,
    latent_features jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.perceptron_weights (
    user_id uuid primary key references auth.users(id) on delete cascade,
    weights jsonb not null default '{}'::jsonb,
    priority double precision not null default 0.4,
    urgency double precision not null default 0.4,
    duration_fit double precision not null default 0.2,
    updated_at timestamptz not null default now()
);

create table if not exists public.latent_key_stats (
    key text primary key,
    count integer not null default 0,
    promoted boolean not null default false,
    promoted_at timestamptz
);

-- Per-user Google OAuth tokens.  The server uses the secret key to access this
-- table; RLS still protects it if a browser client ever accesses the API.
create table if not exists public."GoogleTokens" (
    user_id uuid primary key references auth.users(id) on delete cascade,
    access_token text not null,
    refresh_token text,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Helpful indexes for the user-scoped queries used by the API.
create index if not exists tasks_user_id_idx on public."Tasks" (user_id);
create index if not exists sticky_notes_user_id_idx on public."StickyNotes" (user_id);
create index if not exists busy_times_user_id_idx on public."BusyTimes" (user_id);
create index if not exists timer_session_user_id_idx on public."TimerSession" (user_id);
create index if not exists plants_user_id_idx on public."Plants" (user_id);
create index if not exists schedules_user_id_idx on public.schedules (user_id);
create index if not exists behavior_events_user_id_idx on public.user_behavior_events (user_id);

-- RLS policies.  The backend uses SUPABASE_SECRET_KEY (service role), while
-- these policies keep direct browser access limited to the signed-in user.
alter table public."Tasks" enable row level security;
alter table public."StickyNotes" enable row level security;
alter table public."BusyTimes" enable row level security;
alter table public."TimerSession" enable row level security;
alter table public."Plants" enable row level security;
alter table public.user_visits enable row level security;
alter table public.schedules enable row level security;
alter table public.user_behavior_events enable row level security;
alter table public.perceptron_weights enable row level security;
alter table public."GoogleTokens" enable row level security;
alter table public.latent_key_stats enable row level security;

drop policy if exists "clockin_tasks_owner" on public."Tasks";
create policy "clockin_tasks_owner" on public."Tasks" for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_notes_owner" on public."StickyNotes";
create policy "clockin_notes_owner" on public."StickyNotes" for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_busy_times_owner" on public."BusyTimes";
create policy "clockin_busy_times_owner" on public."BusyTimes" for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_timer_owner" on public."TimerSession";
create policy "clockin_timer_owner" on public."TimerSession" for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_plants_owner" on public."Plants";
create policy "clockin_plants_owner" on public."Plants" for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_visits_owner" on public.user_visits;
create policy "clockin_visits_owner" on public.user_visits for all using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "clockin_schedules_owner" on public.schedules;
create policy "clockin_schedules_owner" on public.schedules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_behavior_owner" on public.user_behavior_events;
create policy "clockin_behavior_owner" on public.user_behavior_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_weights_owner" on public.perceptron_weights;
create policy "clockin_weights_owner" on public.perceptron_weights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "clockin_google_tokens_owner" on public."GoogleTokens";
create policy "clockin_google_tokens_owner" on public."GoogleTokens" for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Latent-key metadata is server-managed.  No browser policy is intentional.

-- Functions used by the dynamic scheduling feature.
create or replace function public.increment_latent_key(key_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
    insert into public.latent_key_stats (key, count, promoted)
    values (key_name, 1, false)
    on conflict (key) do update
        set count = public.latent_key_stats.count + 1;
end;
$$;

create or replace function public.promote_latent_column(col_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
    if col_name !~ '^[a-z][a-z0-9_]{0,62}$' then
        raise exception 'Invalid latent column name';
    end if;
    execute format('alter table public.user_behavior_events add column if not exists %I double precision', col_name);
    execute format(
        'update public.user_behavior_events set %I = (latent_features->>%L)::double precision where latent_features ? %L and %I is null',
        col_name, col_name, col_name, col_name
    );
    update public.latent_key_stats set promoted = true, promoted_at = now() where key = col_name;
end;
$$;

-- These SECURITY DEFINER functions are exclusively called by the backend.
revoke all on function public.increment_latent_key(text) from public, anon, authenticated;
revoke all on function public.promote_latent_column(text) from public, anon, authenticated;
grant execute on function public.increment_latent_key(text) to service_role;
grant execute on function public.promote_latent_column(text) to service_role;

notify pgrst, 'reload schema';
