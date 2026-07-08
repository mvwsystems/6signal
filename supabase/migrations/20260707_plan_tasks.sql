-- Living execution plan: 90-day plan deliverables become a work queue the
-- system executes/briefs against weekly. (Applied to production 2026-07-07.)
create table if not exists plan_tasks (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  plan_audit_id uuid references audits(id) on delete set null,
  phase         text,
  task          text not null,
  detail        text,
  owner         text not null default '6Signal',  -- 6Signal | Client | AI
  signal        text,                             -- GEO/AEO/LEO/VEO/PEO/IEO
  status        text not null default 'open',     -- open | in_progress | done | skipped
  due_date      date,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);
create index if not exists plan_tasks_business_idx on plan_tasks(business_id, status);
alter table plan_tasks enable row level security;
