-- Run this once in the Supabase SQL editor.
-- The backend uses the secret key, but the policy keeps the table safe if it
-- is ever accessed through a user-scoped Supabase client.
create table if not exists public."GoogleTokens" (
    user_id uuid primary key references auth.users(id) on delete cascade,
    access_token text not null,
    refresh_token text,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public."GoogleTokens" enable row level security;

drop policy if exists "Users can read their own Google tokens" on public."GoogleTokens";
create policy "Users can read their own Google tokens"
    on public."GoogleTokens" for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert their own Google tokens" on public."GoogleTokens";
create policy "Users can insert their own Google tokens"
    on public."GoogleTokens" for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Google tokens" on public."GoogleTokens";
create policy "Users can update their own Google tokens"
    on public."GoogleTokens" for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own Google tokens" on public."GoogleTokens";
create policy "Users can delete their own Google tokens"
    on public."GoogleTokens" for delete
    using (auth.uid() = user_id);

-- Refresh PostgREST's schema cache immediately after creating the table.
notify pgrst, 'reload schema';
