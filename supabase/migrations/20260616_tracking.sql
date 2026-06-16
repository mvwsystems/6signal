-- Continuous AI-visibility tracking (dashboard).
-- Run in the Supabase SQL editor (or via the CLI). Service-role only, no public
-- RLS policies — consistent with the rest of the 6Signal schema.

create table if not exists tracked_prompts (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  prompt      text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists tracked_prompts_business_idx on tracked_prompts(business_id);

-- One row per prompt × engine × run. Stores the raw answer + timestamp so a
-- probe is reproducible-as-recorded (engine answers are live/non-deterministic).
create table if not exists probe_results (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  prompt_id   uuid not null references tracked_prompts(id) on delete cascade,
  engine      text not null,                -- chatgpt | perplexity | gemini
  mentioned   boolean not null default false,
  position    int,                          -- rank when mentioned (1 = first)
  sentiment   text,                         -- positive | neutral | negative | null
  competitors jsonb,                        -- names recommended instead
  sources     jsonb,                        -- cited URLs
  answer      text,                         -- raw engine answer (audit trail)
  run_at      timestamptz not null default now()
);
create index if not exists probe_results_business_run_idx on probe_results(business_id, run_at desc);
create index if not exists probe_results_prompt_idx on probe_results(prompt_id);

alter table tracked_prompts enable row level security;
alter table probe_results  enable row level security;
