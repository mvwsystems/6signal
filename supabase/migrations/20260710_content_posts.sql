-- Content engine: AI-generated articles published to client sites via GitHub.
-- businesses.github_repo ("owner/repo") tells the publisher where the client's
-- static site lives; content_posts holds drafts and the publish record.

alter table businesses add column if not exists github_repo text;

create table if not exists content_posts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  status text not null default 'generating', -- generating | draft | published | failed
  title text,
  slug text,
  meta_description text,
  target_prompt text,          -- the buyer query this article is built to win
  article_html text,           -- inner <main> content only (shell added at publish)
  faqs jsonb,                  -- [{q,a}] → FAQPage JSON-LD at publish
  summary text,                -- one-liner for blog index + llms.txt
  repo text,                   -- owner/repo actually published to
  path text,                   -- e.g. blog/slug.html
  url text,                    -- live URL after publish
  commit_sha text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists content_posts_business_idx on content_posts (business_id, created_at desc);

alter table content_posts enable row level security;
