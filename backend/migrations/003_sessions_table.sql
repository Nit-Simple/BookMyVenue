create table sessions(
    id uuid primary key not null default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    refresh_token_hash text not null unique,
    device_info jsonb,
    device_ip inet,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    last_active timestamptz not null default now()
);

create index idx_session_id on sessions(id);
create index idx_sessions_user_id on sessions(user_id);
