-- C5: two-way inbox on top of Gmail (casey@6signal.co). Casey's migration
-- plan, phase C5.
--   inbox_threads    one Gmail conversation, matched to a prospect or not
--   inbox_messages   each message in it (inbound, outbound)
--   inbox_replies    a reply drafted here; approving it puts a DRAFT in
--                    Casey's Gmail. Nothing is ever sent from the dashboard.
-- Reads Casey's mailbox with read-only access plus permission to create
-- drafts. Safe to run twice.

create table if not exists inbox_threads (
  id               uuid primary key default gen_random_uuid(),
  gmail_thread_id  text not null unique,
  prospect_id      uuid references crm_prospects(id) on delete set null,
  subject          text,
  from_email       text,              -- the outside party
  from_name        text,
  snippet          text,
  intent           text check (intent in ('interested', 'question', 'objection', 'not_now', 'stop', 'other')),
  intent_source    text not null default 'auto' check (intent_source in ('auto', 'manual')),
  status           text not null default 'needs_review' check (status in ('needs_review', 'waiting', 'handled')),
  last_inbound_at  timestamptz,
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists inbox_threads_recent_idx on inbox_threads (last_message_at desc);
create index if not exists inbox_threads_prospect_idx on inbox_threads (prospect_id);
alter table inbox_threads enable row level security;

create table if not exists inbox_messages (
  id                uuid primary key default gen_random_uuid(),
  thread_id         uuid not null references inbox_threads(id) on delete cascade,
  gmail_message_id  text not null unique,
  direction         text not null check (direction in ('in', 'out')),
  from_email        text,
  from_name         text,
  to_emails         text[] not null default '{}',
  subject           text,
  body_text         text,
  sent_at           timestamptz not null,
  created_at        timestamptz not null default now()
);
create index if not exists inbox_messages_thread_idx on inbox_messages (thread_id, sent_at);
alter table inbox_messages enable row level security;

create table if not exists inbox_replies (
  id                uuid primary key default gen_random_uuid(),
  thread_id         uuid not null references inbox_threads(id) on delete cascade,
  body              text not null,
  status            text not null default 'pending_approval' check (status in ('pending_approval', 'approved', 'in_gmail', 'killed', 'failed')),
  approval_item_id  uuid references items(id) on delete set null,
  gmail_draft_id    text,
  note              text,
  created_by        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists inbox_replies_thread_idx on inbox_replies (thread_id, created_at);
alter table inbox_replies enable row level security;

insert into connections (name, label, sort, status, note) values
  ('gmail_casey', 'Gmail inbox (casey@6signal.co)', 12, 'not_configured', 'Needs a Google service account with domain-wide delegation (read + create drafts).')
on conflict (name) do nothing;
