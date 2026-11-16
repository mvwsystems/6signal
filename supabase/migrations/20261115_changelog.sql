-- Changelog: tag the Activity log by client and service so it reads as a
-- history of the work. Apply BEFORE merging the Changelog pull request: once
-- merged, every Activity write includes these columns. Safe to run twice.

alter table activity add column if not exists client  text;   -- 6 Signal, X-Act Plumbing, ...
alter table activity add column if not exists service text;   -- CRM, Website, Visibility, ...
alter table activity add column if not exists link    text;   -- the PR, commit, doc or page it refers to
alter table activity add column if not exists source  text not null default 'dashboard';  -- dashboard | github | manual | history

create index if not exists activity_client_idx  on activity(client, created_at desc);
create index if not exists activity_service_idx on activity(service, created_at desc);
create index if not exists activity_source_idx  on activity(source, created_at desc);
create extension if not exists pg_trgm with schema extensions;
create index if not exists activity_summary_trgm on activity using gin (summary extensions.gin_trgm_ops);

-- The filter lists: every client and service used so far.
create or replace view activity_tags with (security_invoker = true) as
  select distinct client, service from activity where client is not null or service is not null;

-- Everything logged so far is 6 Signal's own work in the dashboard.
update activity set client = '6 Signal' where client is null and source = 'dashboard';
update activity set service = case when target_type in ('prospect', 'import', 'merge') then 'CRM' else 'Command Center' end
  where service is null and source = 'dashboard';
