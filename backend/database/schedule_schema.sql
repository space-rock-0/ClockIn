create table if not exists user_behavior_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    task_id uuid not null,
    slot_offered timestamptz not null,
    action text not null check (action in ('accepted', 'rescheduled', 'ignored')),
    created_at timestamptz default now()
);

create table if not exists schedules (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    task_id uuid not null references "Tasks"(id) on delete cascade,
    scheduled_start timestamptz not null,
    scheduled_end timestamptz not null,
    created_at timestamptz default now()
);
