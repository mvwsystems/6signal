-- CRM core (Phase C1 of the Manus CRM migration plan).
-- Replaces the Manus-hosted CRM at crm.6signal.co. Prospects are companies with
-- one main contact; decision makers live in crm_contacts. Every change made in
-- the dashboard is written to crm_activity so nothing changes silently.
-- Apply by hand in the Supabase SQL editor (project 6signal) after review.

create extension if not exists pg_trgm;

create table if not exists crm_prospects (
  id                  uuid primary key default gen_random_uuid(),
  legacy_id           integer unique,              -- Manus CRM id, for the one-time load
  company             text not null,
  contact_name        text,
  contact_title       text,
  email               text,
  phone               text,
  city                text,
  state               text,
  zip                 text,
  website             text,
  website_domain      text,                        -- normalized host, for dedupe
  linkedin            text,
  category            text,
  service_angle       text check (service_angle in ('Website Lead', 'AI Visibility Lead', 'AI Infrastructure Lead')),
  primary_service     text,                        -- offer group, e.g. AI Infrastructure
  primary_sub_service text,                        -- offer, e.g. Automation Dashboard
  addon_services      text[] not null default '{}',
  status              text not null default 'Never contacted' check (status in (
                        'Never contacted', 'Contacted', 'Replied', 'Interested', 'Not now',
                        'Do Not Contact', 'Customer', 'Dead', 'Closed')),  -- 'Closed' = Manus legacy value
  tags                text[] not null default '{}',
  lead_score          integer not null default 0,
  priority_call_rank  integer,
  estimated_revenue   text,
  company_size        text,
  source              text,
  notes               text,
  deal_stage          text not null default 'New Lead' check (deal_stage in (
                        'New Lead', 'Audit Sent', 'Proposal Out', 'Negotiating', 'Closed Won', 'Closed Lost')),
  deal_value          numeric(12,2) not null default 0,
  follow_up_count     integer not null default 0,
  last_contact_at     timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists crm_prospects_status_idx on crm_prospects(status);
create index if not exists crm_prospects_category_idx on crm_prospects(category);
create index if not exists crm_prospects_state_idx on crm_prospects(state);
create index if not exists crm_prospects_angle_idx on crm_prospects(service_angle);
create index if not exists crm_prospects_tags_idx on crm_prospects using gin(tags);
create index if not exists crm_prospects_email_idx on crm_prospects(lower(email));
create index if not exists crm_prospects_domain_idx on crm_prospects(website_domain);
create index if not exists crm_prospects_company_trgm on crm_prospects using gin(company gin_trgm_ops);
create index if not exists crm_prospects_contact_trgm on crm_prospects using gin(contact_name gin_trgm_ops);
create index if not exists crm_prospects_city_trgm on crm_prospects using gin(city gin_trgm_ops);
alter table crm_prospects enable row level security;

-- Verified decision makers per prospect (Manus "contacts").
create table if not exists crm_contacts (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid not null references crm_prospects(id) on delete cascade,
  legacy_id    integer unique,
  name         text,
  title        text,
  email        text,
  phone        text,
  linkedin     text,
  source_urls  text[] not null default '{}',
  confidence   text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists crm_contacts_prospect_idx on crm_contacts(prospect_id);
alter table crm_contacts enable row level security;

-- Stage notes and general notes, one row per note.
create table if not exists crm_notes (
  id            uuid primary key default gen_random_uuid(),
  prospect_id   uuid not null references crm_prospects(id) on delete cascade,
  legacy_id     integer unique,
  type          text not null default 'note',
  content       text not null,
  scheduled_at  timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists crm_notes_prospect_idx on crm_notes(prospect_id, created_at desc);
alter table crm_notes enable row level security;

-- Activity log (Command Center Phase 0, the part C1 needs). Append-only.
create table if not exists crm_activity (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null,                  -- prospect | import | merge
  entity_id    uuid,
  action       text not null,                  -- created | updated | imported | merged | bulk_updated
  summary      text not null,
  changes      jsonb,                          -- { field: { from, to } }
  actor        text not null default 'dashboard',
  created_at   timestamptz not null default now()
);
create index if not exists crm_activity_entity_idx on crm_activity(entity_type, entity_id, created_at desc);
create index if not exists crm_activity_recent_idx on crm_activity(created_at desc);
alter table crm_activity enable row level security;

-- CSV imports: one row per previewed/committed file, with its dedupe report.
create table if not exists crm_imports (
  id                  uuid primary key default gen_random_uuid(),
  filename            text,
  source              text,
  mapping             jsonb not null default '{}',
  row_count           integer not null default 0,
  added               integer not null default 0,
  duplicates_in_file  integer not null default 0,
  duplicates_in_db    integer not null default 0,
  invalid             integer not null default 0,
  merge_candidates    jsonb not null default '[]',   -- [{ row, existingId, reason }]
  created_at          timestamptz not null default now()
);
alter table crm_imports enable row level security;

-- Merges are never silent: the losing record is snapshotted here before delete.
create table if not exists crm_merge_log (
  id               uuid primary key default gen_random_uuid(),
  survivor_id      uuid not null,
  merged_id        uuid not null,
  merged_snapshot  jsonb not null,
  reason           text,
  created_at       timestamptz not null default now()
);
create index if not exists crm_merge_log_survivor_idx on crm_merge_log(survivor_id);
alter table crm_merge_log enable row level security;

-- Saved list views (filters + sort), shared across the operator's devices.
create table if not exists crm_saved_views (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  filters     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
alter table crm_saved_views enable row level security;
