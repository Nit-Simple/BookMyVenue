create type user_role as enum('user','venue_manager','admin');

create table users(
    id uuid primary key,
    email varchar(254) unique,
    password text,
    phone text unique,
    role user_role not null default 'user',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create index idx_user_id_users on users(id);



create or replace function update_updated_at_coloums()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger set_users_updated_at
before update on users for each row
execute function update_updated_at_coloums();
    
