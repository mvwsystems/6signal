-- Close system: an approved proposal becomes a signed agreement, a paid
-- deposit and an onboarding kickoff without chasing. The proposal row stays
-- the one record of the deal; these columns track where it is. Every step is
-- also written to deal_events so the dashboard can show a timeline.
--
-- Status flow:
--   draft → awaiting_approval → sending → sent → viewed → signed → invoiced → paid → won
--   (expired / void are terminal side exits)

alter table public.proposals
  add column if not exists status text not null default 'draft',
  add column if not exists token text unique,
  add column if not exists doc_hash text,
  add column if not exists sent_payload jsonb,
  add column if not exists signer_name text,
  add column if not exists signer_email text,
  add column if not exists sent_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists signed_at timestamptz,
  add column if not exists countersigned_at timestamptz,
  add column if not exists invoiced_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists docuseal_submission_id bigint,
  add column if not exists docuseal_embed_src text,
  add column if not exists docuseal_provider_id bigint,
  add column if not exists signed_pdf_path text,
  add column if not exists stripe_customer_id text,
  add column if not exists deposit_invoice_id text,
  add column if not exists deposit_invoice_url text,
  add column if not exists subscription_id text,
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists send_nonce text,
  add column if not exists countersign_lock_at timestamptz,
  add column if not exists invoice_lock_at timestamptz,
  -- keyed by milestone index ("0", "1", ...) so each one is updated on its own
  add column if not exists milestones_state jsonb not null default '{}'::jsonb,
  add column if not exists reminders jsonb not null default '{}'::jsonb;

create index if not exists proposals_status_idx on public.proposals (status);

create table if not exists public.deal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  kind text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index if not exists deal_events_proposal_idx on public.deal_events (proposal_id, created_at);
alter table public.deal_events enable row level security;
-- No policies: service role only, like every other table.

-- Signed agreements (PDF + audit log) live here, never in the repo (it is public).
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

-- Milestone state is changed one key at a time in a single UPDATE, so a
-- "paid" webhook and a "mark done" tap can't overwrite each other.
create or replace function public.close_ms_claim(p_id uuid, p_idx int)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update proposals
     set milestones_state = milestones_state || jsonb_build_object(p_idx::text, jsonb_build_object('claimed_at', now())),
         updated_at = now()
   where id = p_id and not (milestones_state ? p_idx::text)
  returning true into ok;
  return coalesce(ok, false);
end $$;

create or replace function public.close_ms_patch(p_id uuid, p_idx int, p_patch jsonb)
returns void language sql security definer set search_path = public as $$
  update proposals
     set milestones_state = milestones_state || jsonb_build_object(p_idx::text, coalesce(milestones_state -> p_idx::text, '{}'::jsonb) || p_patch),
         updated_at = now()
   where id = p_id;
$$;

create or replace function public.close_ms_release(p_id uuid, p_idx int)
returns void language sql security definer set search_path = public as $$
  update proposals set milestones_state = milestones_state - p_idx::text
   where id = p_id and not coalesce((milestones_state -> p_idx::text) ? 'invoice_id', false);
$$;

revoke all on function public.close_ms_claim(uuid, int) from public, anon, authenticated;
revoke all on function public.close_ms_patch(uuid, int, jsonb) from public, anon, authenticated;
revoke all on function public.close_ms_release(uuid, int) from public, anon, authenticated;
grant execute on function public.close_ms_claim(uuid, int) to service_role;
grant execute on function public.close_ms_patch(uuid, int, jsonb) to service_role;
grant execute on function public.close_ms_release(uuid, int) to service_role;
