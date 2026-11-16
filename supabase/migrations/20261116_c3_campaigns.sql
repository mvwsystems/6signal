-- C3: campaign sending with approval-first safety, and the Settings tab.
-- Casey's migration plan, phase C3. Six tables:
--   settings          key/value settings edited on the Settings tab
--   territories       protected territories (no prospect inside one, same trade)
--   claimed_markets   markets an existing client has claimed for a trade
--   geo_places        city/state → lat/lng cache for the territory check
--   campaigns         one campaign = one email template + a saved audience
--   campaign_recipients  the exact list frozen when the campaign was created
-- Nothing here sends anything. Sending needs an approved campaign AND the
-- SEND_ENABLED=true config flag, which only Matt sets in Netlify.
-- Safe to run twice.

-- ── Settings ────────────────────────────────────────────────────────────────
create table if not exists settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  text,
  updated_at  timestamptz not null default now()
);
alter table settings enable row level security;

insert into settings (key, value, updated_by) values
  ('sending', jsonb_build_object(
      'from_name', 'Casey | 6 Signal',
      'from_address', '',
      'reply_to', '',
      'signature', jsonb_build_object('name', 'Casey', 'title', '6 Signal AI Coordinator', 'company', '6SIGNAL', 'phone', '(817) 623-6399')
   ), 'setup'),
  ('compliance', jsonb_build_object('mailing_address', '', 'booking_link', ''), 'setup'),
  ('campaign_defaults', jsonb_build_object('daily_cap', 40, 'pilot_min', 5, 'pilot_max', 50, 'send_window_from', '09:00', 'send_window_to', '17:00', 'send_days', jsonb_build_array(1,2,3,4,5)), 'setup')
on conflict (key) do nothing;

-- ── Protected territories ───────────────────────────────────────────────────
create table if not exists territories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  center_city   text not null,
  center_state  text not null,
  lat           double precision,
  lng           double precision,
  radius_miles  numeric not null check (radius_miles > 0 and radius_miles <= 500),
  trade         text not null,
  reason        text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table territories enable row level security;

-- Seed: X-Act's exclusivity. Red Oak, TX centre is approximate (town centre).
insert into territories (name, center_city, center_state, lat, lng, radius_miles, trade, reason)
select 'Red Oak TX', 'Red Oak', 'TX', 32.5176, -96.8044, 15, 'plumbing', 'X-Act exclusivity'
where not exists (select 1 from territories where lower(center_city) = 'red oak' and center_state = 'TX' and trade = 'plumbing');

-- ── Claimed markets ─────────────────────────────────────────────────────────
create table if not exists claimed_markets (
  id          uuid primary key default gen_random_uuid(),
  client      text not null,
  city        text not null,
  state       text not null,
  trade       text not null,
  note        text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists claimed_markets_uniq on claimed_markets (lower(city), upper(state), lower(trade), lower(client));
alter table claimed_markets enable row level security;

-- ── Place cache for the territory radius check ──────────────────────────────
create table if not exists geo_places (
  city_key    text not null,            -- lower(trim(city))
  state       text not null,            -- upper(trim(state))
  lat         double precision,         -- null = looked up, not found
  lng         double precision,
  label       text,
  source      text not null default 'google_places',
  created_at  timestamptz not null default now(),
  primary key (city_key, state)
);
alter table geo_places enable row level security;
insert into geo_places (city_key, state, lat, lng, label, source)
values ('red oak', 'TX', 32.5176, -96.8044, 'Red Oak, TX', 'seed')
on conflict do nothing;

-- ── Campaigns ───────────────────────────────────────────────────────────────
create table if not exists campaigns (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  status                 text not null default 'draft'
                           check (status in ('draft', 'pending_approval', 'queued', 'sending', 'paused', 'sent', 'killed', 'failed')),
  subject                text not null,
  body                   text not null,                 -- plain text with {{tokens}}; signature + footer added at send
  audience               jsonb not null,                -- { view_id, view_name, filters }
  matched_count          int not null default 0,        -- prospects the view matched
  recipient_count        int not null default 0,        -- frozen recipients (with email, after pilot cap)
  pilot                  boolean not null default false,
  pilot_size             int,
  daily_cap              int not null,
  start_at               timestamptz,
  checklist              jsonb,                         -- last checklist result
  checked_at             timestamptz,
  approval_item_id       uuid references items(id) on delete set null,
  instantly_campaign_id  text,
  send_note              text,                          -- why it isn't sending, or what happened
  created_by             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists campaigns_recent_idx on campaigns(created_at desc);
alter table campaigns enable row level security;

create table if not exists campaign_recipients (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  prospect_id  uuid not null references crm_prospects(id) on delete cascade,
  email        text not null,
  first_name   text,
  company      text,
  city         text,
  state        text,
  status       text not null default 'queued' check (status in ('queued', 'pushed', 'skipped')),
  note         text,
  created_at   timestamptz not null default now(),
  unique (campaign_id, prospect_id)
);
create index if not exists campaign_recipients_campaign_idx on campaign_recipients(campaign_id);
alter table campaign_recipients enable row level security;

-- ── Connections: the sending engine and test-send mail ─────────────────────
insert into connections (name, label, sort, status, note) values
  ('instantly', 'Instantly (cold email sending)', 60, 'not_configured', 'Needs an Instantly account and API key. Sending also needs SEND_ENABLED=true.'),
  ('resend',    'Resend (test sends)',            65, 'not_configured', null)
on conflict (name) do nothing;
