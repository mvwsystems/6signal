-- Probe health: distinguish "checked, nothing to measure" from "not named".
--
-- The AI Overviews and Maps probes return ok:true with placeholder text when
-- the source itself is empty (Google shows no AI Overview block; Places returns
-- no results). That was saved as mentioned:false and rendered as a real 0% — so
-- "no AI Overview exists for this query" looked identical to "an AI Overview
-- exists and named your competitors but not you", and dragged the overall
-- mention rate down. This column marks those rows as unmeasured so the UI shows
-- "—" and excludes them from the mention-rate denominators.
--
-- Additive + defaulted: safe on the live table. Existing rows default to
-- measured=true (their prior meaning); a fresh probe sweep re-stamps AI
-- Overviews / Maps rows correctly. Service-role only, no public RLS policies.

alter table probe_results add column if not exists measured boolean not null default true;
