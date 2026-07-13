-- Town-level AI visibility: run the buyer question per service-area town and
-- record which engines name the business in each. AI answers don't vary by GPS
-- coordinate, but they DO vary by place name — this is the honest "AI grid".

create table if not exists ai_town_scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  towns jsonb not null,   -- [{town, prompt, engines:{<engine>:{ok,mentioned,position}}, score}]
  stats jsonb not null,   -- {avg_score, best_town, worst_town, engines_used}
  created_at timestamptz not null default now()
);

create index if not exists ai_town_scans_biz_idx on ai_town_scans (business_id, created_at desc);

alter table ai_town_scans enable row level security;
