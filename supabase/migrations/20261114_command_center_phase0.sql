-- Command Center Phase 0 (Casey's Command Center Spec, §4 and §8).
-- Five tables: items, approvals, activity, connections, exception_rules.
-- Apply in the Supabase SQL editor (project 6signal) BEFORE merging the
-- Phase 0 pull request: once merged, the CRM writes its log to `activity`.
-- Safe to run twice.

-- ── Items: the one work object every panel is a filtered view of ───────────
create table if not exists items (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('approval', 'task', 'exception', 'job', 'booking', 'invoice', 'reply', 'check')),
  title       text not null,
  detail      text,
  source      text not null default 'manual' check (source in ('crm', 'stripe', 'gmail', 'quo', 'callrail', 'calendly', 'dashboard', 'manual')),
  source_id   text,
  source_url  text,
  owner       text not null default 'unassigned' check (owner in ('matt', 'casey', 'unassigned') or owner like 'agent:%'),
  tier        text not null default 'green' check (tier in ('green', 'yellow', 'red')),
  status      text not null default 'new' check (status in ('new', 'waiting', 'approved', 'done', 'blocked', 'failed')),
  due_at      timestamptz,
  payload     jsonb not null default '{}'::jsonb,   -- severity, recommendation, action, sample, ...
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists items_open_idx on items(type, status, created_at);
create index if not exists items_due_idx on items(due_at) where status not in ('done', 'failed');
create index if not exists items_source_idx on items(source, source_id);
alter table items enable row level security;

-- ── Approvals: the decision record for an Item of type 'approval' ──────────
create table if not exists approvals (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null unique references items(id) on delete cascade,
  summary         text not null,
  recommendation  text,
  options         jsonb not null default '[]'::jsonb,  -- [{ label, effect }]
  expires_at      timestamptz,
  decision        text check (decision in ('approved', 'killed')),
  decision_note   text,                                -- required to kill
  decided_by      text,
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);
alter table approvals enable row level security;

-- ── Activity: the one audit log (replaces crm_activity) ────────────────────
create table if not exists activity (
  id           uuid primary key default gen_random_uuid(),
  actor        text not null default 'system',    -- Matt / Casey / Casey (automation) / agent name / system
  action       text not null,
  target_type  text,                              -- prospect | item | connection | import | merge | session | ...
  target_id    uuid,
  summary      text not null,
  changes      jsonb,                             -- before/after: { field: { from, to } }
  created_at   timestamptz not null default now()
);
create index if not exists activity_recent_idx on activity(created_at desc);
create index if not exists activity_target_idx on activity(target_type, target_id, created_at desc);
alter table activity enable row level security;

-- Carry the CRM's existing log over, same ids, so nothing is lost. Run again
-- after the merge deploys to pick up anything written in between (on
-- conflict skips rows already copied). crm_activity is then left frozen.
insert into activity (id, actor, action, target_type, target_id, summary, changes, created_at)
select id, actor, action, entity_type, entity_id, summary, changes, created_at from crm_activity
on conflict (id) do nothing;

-- ── Connections: manual status in Phase 0, live sync from Phase 1 ──────────
create table if not exists connections (
  name          text primary key,
  label         text not null,
  status        text not null default 'not_configured' check (status in ('connected', 'degraded', 'down', 'not_configured')),
  note          text,
  last_sync_at  timestamptz,
  last_error    text,
  sort          int not null default 100,
  updated_by    text,
  updated_at    timestamptz not null default now()
);
alter table connections enable row level security;

insert into connections (name, label, sort, status, note) values
  ('gmail',    'Gmail (casey@ / hello@)', 10, 'not_configured', null),
  ('stripe',   'Stripe',                  20, 'not_configured', null),
  ('calendly', 'Calendly',                30, 'not_configured', null),
  ('quo',      'Quo (phone)',             40, 'not_configured', null),
  ('callrail', 'CallRail (X-Act)',        50, 'not_configured', null),
  ('crm',      'CRM',                     60, 'connected',      'Built into this dashboard since Nov 14, 2026.'),
  ('gbp',      'Google Business Profile', 70, 'not_configured', null),
  ('notion',   'Notion',                  80, 'not_configured', null)
on conflict (name) do nothing;

-- ── Exception rules: the v1 set from spec §6 (evaluated from Phase 1) ──────
create table if not exists exception_rules (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  condition  text not null,
  severity   text not null default 'medium' check (severity in ('high', 'medium', 'low')),
  route      text not null default 'today' check (route in ('today', 'reporter', 'immediate')),
  enabled    boolean not null default true,
  created_at timestamptz not null default now()
);
alter table exception_rules enable row level security;

insert into exception_rules (name, condition, severity, route) values
  ('Failed or unpaid invoice', 'A Stripe invoice fails, or is unpaid 1 day past due', 'high', 'today'),
  ('Reply waiting', 'A reply sits in Needs review for more than 4 working hours', 'medium', 'today'),
  ('Routed call not followed up', 'A Quo call routed to Casey has no follow-up within 24 hours', 'medium', 'today'),
  ('Missed-call cost', 'CallRail: after-hours calls keep rolling to voicemail, or unanswered calls pass the daily threshold', 'medium', 'reporter'),
  ('Approval aging', 'An approval waits more than 24 hours', 'high', 'today'),
  ('Client going quiet', 'No client contact or deliverable in 14 days', 'medium', 'today'),
  ('Delivery blocked', 'A Builder checklist item is blocked for more than 3 days', 'medium', 'reporter'),
  ('Connection down', 'Any connection sync fails twice', 'high', 'immediate'),
  ('Agent job failed', 'A scheduled agent job errors or produces nothing', 'medium', 'today'),
  ('Personal due date', 'A watched personal bill is due in 5 days or less and not confirmed paid (owner only)', 'high', 'today')
on conflict (name) do nothing;

-- ── Five sample Items, one per Today section (spec Phase 0). Delete them ───
-- with "Delete sample items" on Today. Only seeded if none exist yet.
do $$
declare appr uuid;
begin
  if not exists (select 1 from items where payload->>'sample' = 'true') then
    insert into items (type, title, detail, source, owner, tier, status, payload)
    values ('approval', 'Sample: send the X-Act monthly report', 'A sample approval. Approving or killing it only closes it.', 'dashboard', 'matt', 'yellow', 'waiting', '{"sample": true}')
    returning id into appr;
    insert into approvals (item_id, summary, recommendation, options, expires_at)
    values (appr, 'Monthly visibility report for X-Act, ready to send.', 'Casey recommends: approve. Numbers checked against last month.',
            '[{"label": "Approve", "effect": "Closes this sample"}, {"label": "Kill", "effect": "Closes this sample; a reason is required"}]', now() + interval '24 hours');

    insert into items (type, title, detail, source, owner, tier, status, payload) values
      ('exception', 'Sample: a client invoice failed', 'A sample exception. Mark it done to clear it.', 'dashboard', 'matt', 'red', 'new', '{"sample": true, "severity": "high"}'),
      ('job', 'Sample: weekly lead pull is running', 'A sample agent job you are watching.', 'dashboard', 'agent:scout', 'green', 'waiting', '{"sample": true}');

    insert into items (type, title, detail, source, owner, tier, status, due_at, payload) values
      ('task', 'Sample: call back a prospect', 'A sample task due today.', 'manual', 'casey', 'green', 'new',
       (date_trunc('day', now() at time zone 'America/Chicago') + interval '17 hours') at time zone 'America/Chicago', '{"sample": true}');

    insert into items (type, title, detail, source, owner, tier, status, payload) values
      ('check', 'Sample: GBP hours checked for a client', 'A sample receipt in Done since yesterday.', 'dashboard', 'casey', 'green', 'done', '{"sample": true}');
  end if;
end $$;
