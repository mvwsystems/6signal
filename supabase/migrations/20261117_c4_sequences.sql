-- C4: sequences and follow-ups (Casey's migration plan, phase C4).
--   sequences          a named set of ordered email steps
--   sequence_steps     day offset, subject, body with {{variables}}
--   enrollments        one prospect in one sequence, with where it stands
--   sequence_messages  every step's DRAFT for an enrolled prospect
-- Plus one column on crm_prospects: email_invalid_at (set by a bounce).
-- Follow-ups never send from here. A draft needs Matt's approval (or the
-- sequence's owner-only "pre-approved" switch, available after he has
-- approved one batch), and even then nothing goes out while SEND_ENABLED is
-- off. Seeds the 12 Manus sequences (36 steps) as drafts.
-- Safe to run twice.

alter table crm_prospects add column if not exists email_invalid_at timestamptz;

create table if not exists sequences (
  id                     uuid primary key default gen_random_uuid(),
  legacy_id              integer unique,            -- Manus sequence id
  name                   text not null,
  description            text,
  status                 text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  first_batch_approved   boolean not null default false,
  preapproved            boolean not null default false,
  preapproved_by         text,
  preapproved_at         timestamptz,
  created_by             text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
alter table sequences enable row level security;

create table if not exists sequence_steps (
  id           uuid primary key default gen_random_uuid(),
  sequence_id  uuid not null references sequences(id) on delete cascade,
  step_number  int not null check (step_number >= 1),
  day_offset   int not null check (day_offset >= 0 and day_offset <= 365),
  subject      text not null,
  body         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (sequence_id, step_number)
);
alter table sequence_steps enable row level security;

create table if not exists enrollments (
  id            uuid primary key default gen_random_uuid(),
  sequence_id   uuid not null references sequences(id) on delete cascade,
  prospect_id   uuid not null references crm_prospects(id) on delete cascade,
  campaign_id   uuid references campaigns(id) on delete set null,
  status        text not null default 'active' check (status in ('active', 'paused', 'finished', 'removed')),
  stop_reason   text,                    -- reply | booking | bounce | do_not_contact | manual | status
  next_step     int,                     -- step to draft next; null when every step is drafted
  next_due_at   timestamptz,
  enrolled_by   text,
  enrolled_at   timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- One live enrollment per prospect per sequence.
create unique index if not exists enrollments_live_uniq on enrollments (sequence_id, prospect_id) where status in ('active', 'paused');
create index if not exists enrollments_due_idx on enrollments (next_due_at) where status = 'active';
create index if not exists enrollments_prospect_idx on enrollments (prospect_id);
alter table enrollments enable row level security;

create table if not exists sequence_messages (
  id                uuid primary key default gen_random_uuid(),
  enrollment_id     uuid not null references enrollments(id) on delete cascade,
  sequence_id       uuid not null references sequences(id) on delete cascade,
  prospect_id       uuid not null references crm_prospects(id) on delete cascade,
  step_number       int not null,
  to_email          text not null,
  subject           text not null,
  body              text not null,      -- rendered, with signature, footer and unsubscribe link
  status            text not null default 'draft' check (status in ('draft', 'approved', 'sent', 'rejected', 'cancelled')),
  due_at            timestamptz not null,
  approval_item_id  uuid references items(id) on delete set null,
  note              text,
  created_at        timestamptz not null default now(),
  decided_at        timestamptz,
  sent_at           timestamptz,
  unique (enrollment_id, step_number)
);
create index if not exists sequence_messages_prospect_idx on sequence_messages (prospect_id, created_at);
create index if not exists sequence_messages_seq_idx on sequence_messages (sequence_id, status);
alter table sequence_messages enable row level security;

-- ── The 12 Manus sequences, as drafts ───────────────────────────────────────
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (1, $m$GC — Website Opportunity$m$, $m$Draft sequence for general contractors. Routes records with a website to a redesign conversation and records without one to a new-build conversation.$m$, 'draft', 'Manus import', '2026-09-07T00:07:52.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, quick question about {{companyName}}$m$, $m$Hi {{firstName}},

I was looking at how general contractors are typically found before a bid list, referral, or project inquiry. Can I ask—when the right project owner checks out {{companyName}}, does the site make it easy to understand your work and take the next step, or does it mostly act like an online brochure?

Not assuming anything is broken. We help contractors turn an existing site into a clearer project-winning asset—or build one when there is no site to improve.

Would it be a bad idea to compare what that could look like for {{companyName}} in a short call?

{{senderName}}$m$ from sequences where legacy_id = 1 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Should I leave this alone?$m$, $m$Hi {{firstName}},

I know website work is rarely urgent until an opportunity is already being lost. Is improving how {{companyName}} presents projects and captures inquiries something worth looking at this quarter, or should I close the loop for now?

{{senderName}}$m$ from sequences where legacy_id = 1 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Last thought for {{companyName}}$m$, $m$Hi {{firstName}},

Last note from me. If the site is already doing its job, that is useful to know. If it is not, we can show you the gaps before you commit to anything.

Would a brief website opportunity review be useful, or should I step back?

{{senderName}}$m$ from sequences where legacy_id = 1 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (2, $m$Civil & Heavy — AI Infrastructure$m$, $m$Draft sequence for civil and heavy construction firms, focused on bid, project, and field-to-office workflow friction.$m$, 'draft', 'Manus import', '2026-09-07T00:07:52.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, a question on civil project handoffs$m$, $m$Hi {{firstName}},

Civil teams often have bid requests, field updates, subcontractor questions, and follow-ups moving through different people and tools. Can I ask—does {{companyName}} have a clean way to see what needs attention, or is someone still chasing updates across inboxes and calls?

We build practical AI infrastructure that organizes those handoffs without forcing teams into another complicated platform.

Would it be unreasonable to spend 12 minutes seeing whether there is a workflow worth simplifying?

{{senderName}}$m$ from sequences where legacy_id = 2 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Is workflow friction even a priority?$m$, $m$Hi {{firstName}},

I may be reaching at the wrong time. Are bid and project handoffs already running the way you want at {{companyName}}, or is there still manual follow-up that people would rather not be doing?

If it is not a priority, just let me know and I will close this out.

{{senderName}}$m$ from sequences where legacy_id = 2 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Worth a quick workflow review?$m$, $m$Hi {{firstName}},

Last thought: before investing in software, most teams benefit from simply identifying the one or two handoffs that cost the most time. We can help map that quickly.

Would that be useful for {{companyName}}, or should I leave it there?

{{senderName}}$m$ from sequences where legacy_id = 2 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (3, $m$Road & Infrastructure — AI Infrastructure$m$, $m$Draft sequence for roadway and infrastructure contractors, focused on faster response to bid and project information.$m$, 'draft', 'Manus import', '2026-09-07T00:07:52.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, can I ask about bid-response speed?$m$, $m$Hi {{firstName}},

For road and infrastructure work, a lot can depend on how quickly the team can locate bid details, answer a question, or route an opportunity to the right person. Does {{companyName}} have a reliable process for that, or does it still depend on who happens to see the request first?

We create focused AI agents and automations that help teams respond faster without replacing the way they already operate.

Would a short conversation to see whether that applies be worthwhile?

{{senderName}}$m$ from sequences where legacy_id = 3 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Quick follow-up$m$, $m$Hi {{firstName}},

I am not trying to sell a generic AI tool. I am trying to understand whether response delays around bids, project information, or inbound questions are even an issue for {{companyName}}.

Is that worth a quick look, or should I let this go?

{{senderName}}$m$ from sequences where legacy_id = 3 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Close the loop?$m$, $m$Hi {{firstName}},

If improving response speed is not on the list right now, no problem. If it is, we can show a specific workflow before asking you to change anything.

Want me to send a few examples relevant to infrastructure contractors?

{{senderName}}$m$ from sequences where legacy_id = 3 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (4, $m$Utility Contractor — AI Infrastructure$m$, $m$Draft sequence for utility contractors, focused on inbound call coverage and routing.$m$, 'draft', 'Manus import', '2026-09-07T00:07:52.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, are calls ever slipping through?$m$, $m$Hi {{firstName}},

Utility contractors get calls that cannot always wait—service requests, job questions, vendor follow-ups, and new opportunities. Can I ask, when the office is busy or crews are in the field, is every important call routed properly at {{companyName}}?

We build AI reception and routing systems that answer, qualify, and hand off without making callers feel pushed into a phone tree.

Would it be unreasonable to see if there is a coverage gap worth fixing?

{{senderName}}$m$ from sequences where legacy_id = 4 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Should I stop here?$m$, $m$Hi {{firstName}},

If your phones and follow-up process are already covered, I do not want to create noise. If calls are occasionally being missed or routed late, that is the kind of issue we help solve.

Which is closer to the truth at {{companyName}}?

{{senderName}}$m$ from sequences where legacy_id = 4 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$One last question$m$, $m$Hi {{firstName}},

A quick AI receptionist review usually shows whether the opportunity is real in a few minutes. If there is no gap, you will know that too.

Worth a brief call, or should I close this out?

{{senderName}}$m$ from sequences where legacy_id = 4 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (5, $m$Specialty Trade — Website Opportunity$m$, $m$Draft sequence for specialty trades, focused on turning local search and referrals into qualified job inquiries.$m$, 'draft', 'Manus import', '2026-09-07T00:07:52.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, a quick question about new job inquiries$m$, $m$Hi {{firstName}},

When someone needs a specialty contractor, they usually check the company online before they call. Does {{companyName}}'s website make it immediately clear what work you handle, where you work, and how to request help?

We help trade contractors improve an existing site—or create a new one—so more of those visits become qualified conversations.

Would it be a stretch to take a quick look at what the site is communicating today?

{{senderName}}$m$ from sequences where legacy_id = 5 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Worth improving, or already covered?$m$, $m$Hi {{firstName}},

I know most contractor websites get pushed aside until business slows down. Is generating better-fit job inquiries from your online presence worth discussing now, or is {{companyName}} already where you want to be?

{{senderName}}$m$ from sequences where legacy_id = 5 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Should I close the file?$m$, $m$Hi {{firstName}},

Last note. We can show a practical website plan before you decide whether to do anything. Would a short review be useful, or should I close the loop?

{{senderName}}$m$ from sequences where legacy_id = 5 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (6, $m$Engineering & Surveying — AI Visibility$m$, $m$Draft sequence for engineering and surveying firms, focused on being found for specific project expertise.$m$, 'draft', 'Manus import', '2026-09-07T00:07:52.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, can clients find {{companyName}} for the right work?$m$, $m$Hi {{firstName}},

When a municipality, developer, or contractor searches for a firm with a specific engineering or surveying capability, does {{companyName}} show up clearly—or do less-qualified firms win attention simply because they are easier to find?

We run AI visibility audits that show how a firm appears across modern search and AI-driven discovery, then identify the clearest opportunities to improve it.

Would a short, no-pressure visibility review be useful?

{{senderName}}$m$ from sequences where legacy_id = 6 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Is visibility already where it needs to be?$m$, $m$Hi {{firstName}},

I am not suggesting more marketing for the sake of marketing. The question is whether the right buyers can find and understand {{companyName}} when a relevant project appears.

Is that worth checking, or should I close the loop?

{{senderName}}$m$ from sequences where legacy_id = 6 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$One final thought$m$, $m$Hi {{firstName}},

A visibility audit is useful even if you decide not to change anything—it shows what prospective clients are likely seeing today.

Would you like me to outline what we would check for {{companyName}}?

{{senderName}}$m$ from sequences where legacy_id = 6 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (7, $m$Architecture & Design — AI Visibility$m$, $m$Draft sequence for architecture and design firms, focused on project-expertise discovery and authority.$m$, 'draft', 'Manus import', '2026-09-07T00:07:53.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, a question about design-firm discovery$m$, $m$Hi {{firstName}},

When a client searches for design expertise in a particular project type, does {{companyName}} show up as a clear option—or is your strongest work hard to discover unless someone already knows you?

We help architecture and design firms improve how their capabilities and portfolio are understood by search engines and AI tools.

Would it be unreasonable to compare notes for a few minutes?

{{senderName}}$m$ from sequences where legacy_id = 7 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Wrong time to discuss visibility?$m$, $m$Hi {{firstName}},

If referral flow is already exactly where you want it, I will step back. If you want more of the right project conversations, a visibility review can show whether your online presence is helping or holding that back.

Worth a look?

{{senderName}}$m$ from sequences where legacy_id = 7 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Close the loop?$m$, $m$Hi {{firstName}},

Last note from me. Would it help to see a concise view of how {{companyName}} appears for the project types you want more of, or should I close this file?

{{senderName}}$m$ from sequences where legacy_id = 7 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (8, $m$Materials & Equipment — Website Opportunity$m$, $m$Draft sequence for suppliers and manufacturers, focused on product clarity and dealer or buyer inquiries.$m$, 'draft', 'Manus import', '2026-09-07T00:07:53.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, can buyers quickly understand your offering?$m$, $m$Hi {{firstName}},

When a contractor or purchasing team lands on {{companyName}} online, can they quickly understand the products, applications, and next step—or do they have to hunt for basic answers?

We redesign supplier websites so technical information is clear, credible, and built to turn research into real inquiries.

Would it be a bad idea to look at where the current experience may be losing attention?

{{senderName}}$m$ from sequences where legacy_id = 8 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Is the site doing enough today?$m$, $m$Hi {{firstName}},

A lot of supplier sites have good information but make it difficult for the right buyer to take action. Is improving that experience important for {{companyName}} this year, or should I let this go?

{{senderName}}$m$ from sequences where legacy_id = 8 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Last note$m$, $m$Hi {{firstName}},

If you are open to it, we can show a few concrete improvements before proposing any project. Would that be useful, or should I close the loop?

{{senderName}}$m$ from sequences where legacy_id = 8 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (9, $m$Developer & Owner — AI Infrastructure$m$, $m$Draft sequence for developers and owners, focused on inquiry follow-up and stakeholder coordination.$m$, 'draft', 'Manus import', '2026-09-07T00:07:53.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, a question about inquiry follow-up$m$, $m$Hi {{firstName}},

With development projects, the cost of slow follow-up can be high—whether the inquiry comes from a tenant, investor, contractor, or project partner. Can I ask, does {{companyName}} have a simple way to capture, route, and follow through on those conversations?

We connect practical AI workflows to the systems teams already use, so important opportunities do not sit in an inbox.

Would a short call to see if there is a gap be useful?

{{senderName}}$m$ from sequences where legacy_id = 9 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Should I leave this alone?$m$, $m$Hi {{firstName}},

I realize process improvements are not always urgent. Is managing inbound conversations and stakeholder follow-up already working well at {{companyName}}, or is there enough manual coordination to justify a look?

{{senderName}}$m$ from sequences where legacy_id = 9 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Worth mapping one workflow?$m$, $m$Hi {{firstName}},

Last thought: one 15-minute workflow review can show whether AI infrastructure would actually help. If not, you will know quickly.

Worth scheduling, or should I close this out?

{{senderName}}$m$ from sequences where legacy_id = 9 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (10, $m$Public Agency — Digital Visibility Review$m$, $m$Draft sequence for public agencies, focused on clear public information and discoverability. Review procurement and communications policies before use.$m$, 'draft', 'Manus import', '2026-09-07T00:07:53.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, a question about public information access$m$, $m$Hi {{firstName}},

Residents, vendors, and project partners often look online before they know which department to call. Can I ask—does {{companyName}} make it easy for them to find accurate information and the right next step?

We provide digital visibility reviews that identify where public-facing information may be difficult to discover or understand.

If outside vendor conversations are permitted, would a brief review be useful?

{{senderName}}$m$ from sequences where legacy_id = 10 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 5, $m$Appropriate contact?$m$, $m$Hi {{firstName}},

I want to respect your communications and procurement process. If there is a more appropriate person or process for digital information and visibility, could you point me in the right direction?

{{senderName}}$m$ from sequences where legacy_id = 10 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 10, $m$Closing the loop$m$, $m$Hi {{firstName}},

Last note. If this is not a current priority or the outreach route is not appropriate, no response is needed and I will close the loop.

{{senderName}}$m$ from sequences where legacy_id = 10 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (11, $m$Construction Contractor — Website Opportunity$m$, $m$Draft sequence for construction contractors with an unspecified trade, focused on clearer online credibility and inquiry conversion.$m$, 'draft', 'Manus import', '2026-09-07T00:07:53.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, a quick question about {{companyName}} online$m$, $m$Hi {{firstName}},

Before a new customer calls a contractor, they usually decide whether the company feels credible online. Does {{companyName}} make that decision easy—with clear services, proof of work, and a simple way to start a conversation?

We build and redesign contractor websites around that exact problem.

Would it be useful to see a quick opportunity review for {{companyName}}?

{{senderName}}$m$ from sequences where legacy_id = 11 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Is this relevant right now?$m$, $m$Hi {{firstName}},

If online presence is already working for {{companyName}}, I will not keep following up. If it is not producing the kind of inquiries you want, a short review may be useful.

Is it worth a look?

{{senderName}}$m$ from sequences where legacy_id = 11 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Last thought$m$, $m$Hi {{firstName}},

We can show the gaps first and let you decide whether any change is justified. Would you like that review, or should I close the file?

{{senderName}}$m$ from sequences where legacy_id = 11 on conflict (sequence_id, step_number) do nothing;
insert into sequences (legacy_id, name, description, status, created_by, created_at) values (12, $m$Construction Services — AI Visibility$m$, $m$Draft sequence for construction-services firms with limited trade detail, focused on how the right buyers find the company.$m$, 'draft', 'Manus import', '2026-09-07T00:07:53.000Z') on conflict (legacy_id) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 1, 0, $m${{firstName}}, can the right buyers find {{companyName}}?$m$, $m$Hi {{firstName}},

A quick question: when someone searches for the kind of construction support {{companyName}} provides, do you know whether they are finding you—or mainly finding the companies that publish more clearly?

We run a practical AI visibility review to show where a company appears, what is unclear, and which improvements are most likely to matter.

Would a short review be useful?

{{senderName}}$m$ from sequences where legacy_id = 12 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 2, 3, $m$Worth looking at visibility?$m$, $m$Hi {{firstName}},

I am not assuming {{companyName}} needs more leads. I am asking whether the right people can find and understand you when they are ready.

Is that worth a conversation, or should I close this out?

{{senderName}}$m$ from sequences where legacy_id = 12 on conflict (sequence_id, step_number) do nothing;
insert into sequence_steps (sequence_id, step_number, day_offset, subject, body) select id, 3, 7, $m$Close the loop?$m$, $m$Hi {{firstName}},

Last note from me. If a visibility review could help you see what buyers are actually encountering online, I am happy to show you. Otherwise, I will step back.

{{senderName}}$m$ from sequences where legacy_id = 12 on conflict (sequence_id, step_number) do nothing;
