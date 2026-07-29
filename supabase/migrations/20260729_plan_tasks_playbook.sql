-- Deterministic playbook task generation.
--
-- Problem: plan_tasks rows were produced by a free-form LLM plan and inserted
-- with a plain INSERT (no stable key), so pressing "Build 90-Day Plan" again
-- appended a fresh ~15-task batch every time (one business accumulated ~45
-- near-duplicate rows). Fix: give every task a stable task_key derived from a
-- versioned playbook, so regeneration UPSERTs the current correct set instead
-- of appending.
--
-- Safe to apply on a live table: both columns are nullable/additive and the
-- unique index is PARTIAL (only rows that have a task_key are constrained), so
-- pre-existing legacy rows (task_key null) are untouched and never collide.
-- Service-role only, no public RLS policies — consistent with the rest of the
-- 6Signal schema.

alter table plan_tasks add column if not exists task_key         text;
alter table plan_tasks add column if not exists playbook_version text;

-- Idempotency guard: at most one row per (business, task_key) once keyed.
-- Enables `upsert(..., { onConflict: "business_id,task_key" })` from the app.
create unique index if not exists plan_tasks_business_taskkey_uidx
  on plan_tasks (business_id, task_key)
  where task_key is not null;
