-- Geo-grid Maps visibility scans: rank at each point of an NxN grid around the
-- business (SerpAPI google_maps per point). Powers the coverage radar in the
-- dashboard, client reports, and share pages.

create table if not exists maps_grid_scans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  keyword text not null,
  center jsonb not null,        -- {lat, lng, label}
  grid_size int not null,       -- N (NxN points)
  spacing_miles numeric not null,
  points jsonb not null,        -- row-major [{lat, lng, rank|null, top:[names]}]
  stats jsonb not null,         -- {present, top3, top10, total, avg_rank, coverage}
  created_at timestamptz not null default now()
);

create index if not exists maps_grid_scans_biz_idx on maps_grid_scans (business_id, created_at desc);

alter table maps_grid_scans enable row level security;
