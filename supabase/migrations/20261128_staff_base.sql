-- AI staff shared base (AI staff blueprint, "Shared base: build this first").
-- Three tables next to the Command Center ones: agents (the roster), agent_runs
-- (the run log) and agent_playbooks (versioned prompts and SOPs). The task list
-- (items), approval queue (approvals) and activity log are reused, not copied;
-- activity only gains a nullable run_id so a run's actions can be traced.
-- Apply in the Supabase SQL editor (project 6signal) BEFORE merging the Staff
-- pull request: the Staff tab reads these tables. Safe to run twice.
-- RLS matches every other table here: on, no policies, service role only.

-- ── Agents: one row per staff role ─────────────────────────────────────────
-- key is the same owner key items.owner uses: 'casey', 'matt', 'agent:<name>'.
create table if not exists agents (
  key              text primary key check (key in ('casey', 'matt') or key ~ '^agent:[a-z0-9-]+$'),
  name             text not null,
  role             text not null,                      -- e.g. "Lead Researcher"
  department       text not null check (department in ('command', 'growth', 'revenue_risk', 'delivery')),
  job              text,                               -- one line on what it does
  runs_on          text,                               -- where it runs (dashboard function, Claude Duet routine, Muse, ...)
  schedule         text,                               -- plain words or cron, e.g. "Weekdays 6 AM CT"
  gate             text,                               -- its approval tier in words, from the blueprint
  phase            text,                               -- P0, P1, P1b, P2, P3, Later
  status           text not null default 'not_started' check (status in ('not_started', 'building', 'active', 'paused', 'retired')),
  enabled          boolean not null default false,     -- the on/off switch; nothing scheduled runs while false
  auto_send        boolean not null default false,     -- earned later (blueprint: 20 clean approvals); owner-only switch
  monthly_cap_usd  numeric(10, 2),                     -- spend cap; null = not set yet
  owner            text not null default 'matt' check (owner in ('matt', 'casey')),  -- the human answerable for it
  playbook_url     text,                               -- optional link to a longer doc; the versions live in agent_playbooks
  sort             int not null default 100,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table agents enable row level security;

-- ── Agent runs: the run log ────────────────────────────────────────────────
create table if not exists agent_runs (
  id                uuid primary key default gen_random_uuid(),
  agent_key         text not null references agents(key) on delete cascade,
  job               text,                              -- the sub-agent or job name, e.g. "weekly lead pull"
  trigger           text not null default 'schedule' check (trigger in ('schedule', 'manual', 'event')),
  status            text not null default 'running' check (status in ('running', 'succeeded', 'failed', 'cancelled')),
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  result            text,                              -- one line on what came of it
  items_created     int not null default 0 check (items_created >= 0),
  rows_written      int not null default 0 check (rows_written >= 0),
  cost_usd          numeric(10, 4) not null default 0 check (cost_usd >= 0),
  error             text,
  playbook_version  int,                               -- the version it ran on
  meta              jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index if not exists agent_runs_agent_idx on agent_runs(agent_key, started_at desc);
create index if not exists agent_runs_recent_idx on agent_runs(started_at desc);
create index if not exists agent_runs_open_idx on agent_runs(status) where status = 'running';
alter table agent_runs enable row level security;

-- ── Agent playbooks: versioned prompt + SOPs per agent ─────────────────────
-- Only an approved version can be active (prompt changes need Matt's yes), and
-- only one version per agent is active at a time.
create table if not exists agent_playbooks (
  id           uuid primary key default gen_random_uuid(),
  agent_key    text not null references agents(key) on delete cascade,
  version      int not null check (version > 0),
  title        text,
  content      text not null,
  change_note  text,                                   -- what changed from the last version
  created_by   text not null default 'system',
  approved_by  text,
  approved_at  timestamptz,
  active       boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (agent_key, version),
  check (not active or approved_by is not null)
);
create unique index if not exists agent_playbooks_one_active on agent_playbooks(agent_key) where active;
alter table agent_playbooks enable row level security;

-- ── Activity: link an entry to the run that made it ────────────────────────
alter table activity add column if not exists run_id uuid references agent_runs(id) on delete set null;
create index if not exists activity_run_idx on activity(run_id) where run_id is not null;

-- ── Seed: the 14 roles from the AI staff blueprint ─────────────────────────
-- Names are working names (still Matt's call). Casey already works today in
-- Muse, so starts active and on; every other role starts not_started and off.
insert into agents (key, name, role, department, job, runs_on, gate, phase, status, enabled, owner, sort) values
  ('casey',        'Casey', 'Chief of Staff',      'command',      'Routes every new ask into items, runs the inbox and calendar, sends approved 1:1 email and texts, writes the daily digest and Monday briefing', 'Muse (Gmail, Stripe, GitHub, Quo), polls on its schedule', 'Sends only what Matt approved', 'P0', 'active', true, 'matt', 10),
  ('agent:quinn',  'Quinn', 'Data Analyst',        'command',      'Keeps the scoreboard true, tracks where every lead came from, writes the Monday numbers, spots drops', 'Dashboard scheduled function + weekly Claude Duet routine', 'Green: internal only', 'P1', 'not_started', false, 'matt', 20),
  ('agent:hawk',   'Hawk',  'Market Watcher',      'command',      'Watches tools, search, AI visibility and construction tech; daily log, weekly brief, same-day alert only when a client or offer is hit', 'Daily Claude Duet routine with web search + probe data', 'Green: internal only', 'P1', 'not_started', false, 'matt', 30),
  ('agent:gage',   'Gage',  'Systems Operator',    'command',      'Keeps every agent, connection, backup, domain and client system running; guards spend; manages access without touching passwords; versions the playbooks', 'Dashboard scheduled functions + Claude Duet routine', 'Green; raising caps, DNS and access changes are red', 'P0', 'not_started', false, 'matt', 40),
  ('agent:scout',  'Scout', 'Lead Researcher',     'growth',       'Finds, dedupes, verifies and enriches leads; runs the free AI visibility check per lead', 'Dashboard agent: scheduled function + Claude API, Apollo', 'Green', 'P1', 'not_started', false, 'matt', 50),
  ('agent:reid',   'Reid',  'Outbound Writer',     'growth',       'Writes campaigns in Matt''s name, tags and drafts replies, runs follow-up, guards deliverability', 'Dashboard agent in Sequences + Inbox; Instantly sends', 'Yellow until auto-send is earned', 'P1', 'not_started', false, 'matt', 60),
  ('agent:wren',   'Wren',  'Content Director',    'growth',       'Turns the weekly recording into posts, keyword DMs, the newsletter issue and site pages', 'Claude Duet channel weekly + dashboard Newsletter tab; GoHighLevel schedules', 'Yellow: one weekly batch, one issue', 'P1b', 'not_started', false, 'matt', 70),
  ('agent:juno',   'Juno',  'Products and Partners','growth',      'Runs low-ticket funnels, the Trades OS community, newsletter sponsors and referral partners', 'GoHighLevel, Stripe, Skool (drafts only)', 'Green for pre-approved delivery; yellow or red for anything new', 'Later', 'not_started', false, 'matt', 80),
  ('agent:paige',  'Paige', 'Deal Desk',           'revenue_risk', 'Call prep brief, proposal from transcript, Close flow, proposal chasers', 'Dashboard agent + Close, call transcripts', 'Red: every proposal, price and contract', 'P2', 'not_started', false, 'matt', 90),
  ('agent:penny',  'Penny', 'Finance',             'revenue_risk', 'Milestone and retainer invoices, collections on a 15/30/45-day cadence, tool-spend audit', 'Dashboard agent; Stripe; receipts in Gmail', 'Red: every invoice, refund and cancellation', 'P2', 'not_started', false, 'matt', 100),
  ('agent:lex',    'Lex',   'Legal and Risk',      'revenue_risk', 'Keeps contract templates, flags changes in client paper, tracks legal and renewal deadlines; prepares, and Matt or a lawyer decides', 'Claude Duet routine; playbooks; dashboard', 'Red: anything legal', 'P2', 'not_started', false, 'matt', 110),
  ('agent:forge',  'Forge', 'Builder',             'delivery',     'Builds sites, Hub and LoadPath work, visibility fixes, SOPs', 'Claude Duet threads + Claude Code', 'Yellow: merge to production', 'P2', 'not_started', false, 'matt', 120),
  ('agent:proof',  'Proof', 'QA',                  'delivery',     'Checks every build and client-facing draft, and samples a tenth of all agent work each week', 'Separate Claude review pass (never the session that built it)', 'Green; nothing reaches Matt unchecked', 'P2', 'not_started', false, 'matt', 130),
  ('agent:ava',    'Ava',   'Client Success',      'delivery',     'Onboarding, support answers, monthly report, health score, referrals, clean offboarding', 'Dashboard agent; Resend sends', 'Yellow until earned; red for upsells and red-health clients', 'P3', 'not_started', false, 'matt', 140)
on conflict (key) do nothing;
