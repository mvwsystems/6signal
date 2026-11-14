-- Command Center Phase 0: Items and Approvals.
-- One table holds everything that needs a person: tasks, approval requests
-- and reports. An approval is an Item whose `action` names a registered
-- action (app/lib/commandCenter.ts); the action can only run once the item
-- is approved, and Red-tier actions only by the owner account. Every change
-- is written to crm_activity (entity_type 'item'), which is the Activity log.
-- Apply by hand in the Supabase SQL editor (project 6signal) after review.

create table if not exists cc_items (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'task'
                 check (kind in ('task', 'approval', 'report')),
  title          text not null,
  body           text,
  tier           text not null default 'green'
                 check (tier in ('green', 'yellow', 'red')),
  -- tasks/reports: open | done | dismissed
  -- approvals:     pending | approved | rejected | executing | executed | failed
  status         text not null default 'open'
                 check (status in ('open', 'done', 'dismissed', 'pending', 'approved', 'rejected', 'executing', 'executed', 'failed')),
  assignee       text not null default 'operator'
                 check (assignee in ('owner', 'operator')),
  due_at         timestamptz,
  action         text,                 -- registered action key an approval unlocks
  payload        jsonb,                -- what the action will do, shown before approval
  entity_type    text,                 -- what it is about (prospect, campaign, ...)
  entity_id      uuid,
  created_by     text not null default 'system',
  decided_by     text,
  decided_at     timestamptz,
  decision_note  text,
  executed_by    text,
  executed_at    timestamptz,
  result         text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint cc_items_approval_has_action check (kind <> 'approval' or action is not null)
);

create index if not exists cc_items_kind_status_idx on cc_items(kind, status, created_at desc);
create index if not exists cc_items_due_idx on cc_items(due_at) where status = 'open';
create index if not exists cc_items_entity_idx on cc_items(entity_type, entity_id);

-- Service role only, like the crm_ tables.
alter table cc_items enable row level security;
