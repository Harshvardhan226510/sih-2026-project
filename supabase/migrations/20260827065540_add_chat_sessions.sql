create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check(role in ('user', 'bot')),
  content text not null,
  citations jsonb,
  created_at timestamptz default now()
);

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
create policy "public all" on chat_sessions for all using (true) with check (true);
create policy "public all" on chat_messages for all using (true) with check (true);
