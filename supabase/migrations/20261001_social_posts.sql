-- Social carousel pipeline: one row per carousel render.
create table if not exists public.social_posts (
  id             uuid primary key default gen_random_uuid(),
  property_id    text not null,
  ref            text not null,
  status         text not null default 'rendering'
                 check (status in ('rendering','pending_approval','approved','scheduled',
                                   'published','rejected','failed')),
  source_images  text[] not null default '{}',
  slide_urls     text[] not null default '{}',
  caption_en     text,
  caption_ar     text,
  reject_note    text,
  requested_by   uuid,
  approved_by    uuid,
  approved_at    timestamptz,
  scheduled_for  timestamptz,
  ig_media_id    text,
  fb_post_id     text,
  error          text,
  rendered_at    timestamptz,
  published_at   timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists social_posts_property_idx on public.social_posts (property_id, status);
create index if not exists social_posts_queue_idx    on public.social_posts (status, scheduled_for);

alter table public.social_posts enable row level security;
-- Server routes use the service role key (bypasses RLS).
-- Add admin-only select/update policies when the approval screen is built.

-- Public bucket: Instagram's API must be able to fetch slide images by URL.
insert into storage.buckets (id, name, public)
values ('social-carousels', 'social-carousels', true)
on conflict (id) do nothing;
