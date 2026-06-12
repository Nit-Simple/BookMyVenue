create type providers as enum('apple','google');


create table user_identities(
    id uuid primary key not null  default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    oauth_provider providers not null,
    provider_id text not null,
    created_at timestamptz not null default now(),

    unique(oauth_provider,provider_id)
);



create index idx_user_id_user_identites on user_identities(user_id);
create index idx_provider_id_user_identities on user_identities(provider_id);
