-- Client contact email for owner-triggered client updates (applied 2026-07-09).
alter table businesses add column if not exists contact_email text;
