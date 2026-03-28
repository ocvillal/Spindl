-- ================================================================
-- Spindl — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

-- entries table: stores every album/song a user has logged
create table if not exists entries (
  row_id      uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  item_id     text        not null,                         -- Spotify album or track ID
  type        text        not null check (type in ('album', 'song')),
  rating      integer     not null check (rating >= 1 and rating <= 5),
  review      text        not null default '',
  liked       boolean     not null default false,
  date        text        not null,                         -- human-readable, e.g. "Mar 25, 2026"
  album_data  jsonb       not null,                         -- full Album object snapshot
  track_data  jsonb,                                        -- full Track object snapshot (songs only)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- one entry per user per item per type (upsert target)
  unique (user_id, type, item_id)
);

-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger entries_updated_at
  before update on entries
  for each row execute procedure set_updated_at();

-- ── Row Level Security ──────────────────────────────────────────
-- CRITICAL: without RLS a user could read/write anyone's data.
-- These policies enforce ownership at the database level,
-- regardless of what the app code does.

alter table entries enable row level security;

create policy "select_own_entries" on entries
  for select using (auth.uid() = user_id);

create policy "insert_own_entries" on entries
  for insert with check (auth.uid() = user_id);

create policy "update_own_entries" on entries
  for update using (auth.uid() = user_id);

create policy "delete_own_entries" on entries
  for delete using (auth.uid() = user_id);

-- ── Indexes ─────────────────────────────────────────────────────
create index if not exists entries_user_id_idx on entries (user_id);
create index if not exists entries_type_idx    on entries (type);

-- ── Profiles ────────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid    primary key references auth.users(id) on delete cascade,
  name         text    not null default '',
  username     text    not null unique,
  avatar_url   text    not null default '',
  genres       text[]  not null default '{}',
  fav_artists  text[]  not null default '{}',
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- ── Discover Actions ─────────────────────────────────────────────
-- Stores swipe decisions: listened, not_heard, saved
create table if not exists discover_actions (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    not null references auth.users(id) on delete cascade,
  track_id    text    not null,
  track_data  jsonb   not null,
  action      text    not null check (action in ('listened', 'not_heard', 'saved')),
  rating      integer check (rating is null or (rating >= 1 and rating <= 5)),
  created_at  timestamptz not null default now(),
  unique (user_id, track_id)
);

alter table discover_actions enable row level security;
create policy "discover_select_own" on discover_actions for select using (auth.uid() = user_id);
create policy "discover_insert_own" on discover_actions for insert with check (auth.uid() = user_id);
create policy "discover_update_own" on discover_actions for update using (auth.uid() = user_id);

-- ── Chart Snapshots ──────────────────────────────────────────────
-- Stores weekly Last.fm global chart snapshots for time-based charts.
-- Seeded client-side on app open; accumulates one batch of 50 rows per week.
create table if not exists chart_snapshots (
  id          uuid    primary key default gen_random_uuid(),
  week_start  date    not null,           -- Monday of the week fetched (YYYY-MM-DD)
  track_id    text    not null,           -- slugified "artist-track" key
  track_name  text    not null,
  artist_name text    not null,
  track_data  jsonb   not null,           -- full Track object snapshot
  playcount   bigint  not null,
  unique (week_start, track_id)
);

-- Public chart data: anyone can read, only authenticated users can write
alter table chart_snapshots enable row level security;
create policy "chart_snapshots_select" on chart_snapshots for select using (true);
create policy "chart_snapshots_insert" on chart_snapshots for insert with check (auth.uid() is not null);

create index if not exists chart_snapshots_week_idx on chart_snapshots (week_start);

-- NOTE: For avatar uploads, create a public Supabase Storage bucket named "avatars"
-- Dashboard → Storage → New bucket → name: avatars → Public: on
