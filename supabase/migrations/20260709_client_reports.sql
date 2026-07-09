-- Client-facing reports (baseline + monthly editions) + public share tokens.
-- (Applied to production 2026-07-09.)
create table if not exists client_reports (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  period_label text,
  payload      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists client_reports_business_idx on client_reports(business_id, created_at desc);
alter table client_reports enable row level security;

alter table businesses add column if not exists share_token text unique;
