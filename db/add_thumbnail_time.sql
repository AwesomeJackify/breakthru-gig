-- Adds per-video cover-frame support (the "choose the cover" feature).
-- Stores the timestamp (in seconds) Mux should render the thumbnail/poster from.
-- Run once in the Supabase SQL editor (Dashboard → SQL Editor → New query).

alter table videos
  add column if not exists thumbnail_time numeric not null default 10;
