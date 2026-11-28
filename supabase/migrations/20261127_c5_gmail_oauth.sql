-- C5 follow-up: connect casey@'s Gmail with a one-time Google sign-in
-- instead of a service-account key (Google refuses to create keys on
-- 6signal.co, by organization policy, and that policy stays on).
--
-- gmail_tokens holds the long-lived Google refresh token for the inbox
-- mailbox, encrypted by the app (AES-256-GCM) before it is written. Only the
-- server's service role can read or write it: row level security is on with
-- no policies, and the anon/authenticated roles have no grants. The token is
-- never sent to the browser. Safe to run twice.

create table if not exists gmail_tokens (
  mailbox            text primary key,
  refresh_token_enc  text not null,
  scopes             text not null,
  connected_by       text,
  connected_at       timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table gmail_tokens enable row level security;
revoke all on table gmail_tokens from anon, authenticated;

update connections
   set note = 'Connect casey@ with Google in Settings (read + create drafts; never sends).'
 where name = 'gmail_casey' and status = 'not_configured';
