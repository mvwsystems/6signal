-- Newsletter issues ("Intelligence Briefs") composed in /dashboard, sent as
-- Resend broadcasts, and archived publicly at /briefings.
-- Distinct from app/lib/briefing.ts, which is the private owner briefing email.
create table if not exists briefings (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null,
  subject             text not null,
  preview             text,
  body                text not null default '',   -- markdown source
  status              text not null default 'draft',  -- draft | scheduled | sent
  resend_broadcast_id text,
  recipients          integer,
  scheduled_at        timestamptz,
  sent_at             timestamptz,
  published_at        timestamptz,                -- non-null = visible at /briefings
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists briefings_published_idx on briefings(published_at desc);
alter table briefings enable row level security;

-- Incremental marker for the leads -> Resend contact sync. Null = never synced.
alter table leads add column if not exists resend_synced_at timestamptz;
