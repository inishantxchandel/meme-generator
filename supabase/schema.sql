-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table if not exists public.memes (
  id            text primary key,
  created_at    timestamptz not null default now(),
  image_url     text not null,
  image_path    text not null,
  template_id   text not null,
  caption_top   text,
  caption_bottom text,
  caption_extra  jsonb,
  export_url    text,
  metadata      jsonb default '{}'::jsonb
);

create table if not exists public.reactions (
  id         uuid primary key default uuid_generate_v4(),
  meme_id    text not null references public.memes(id) on delete cascade,
  emoji      text not null check (emoji in ('😂', '👍', '🔥', '💀')),
  reactor_id text not null,
  created_at timestamptz not null default now(),
  unique(meme_id, reactor_id, emoji)
);

create index if not exists idx_reactions_meme_id on public.reactions(meme_id);
create index if not exists idx_memes_created_at on public.memes(created_at desc);

alter table public.memes enable row level security;
alter table public.reactions enable row level security;

drop policy if exists "memes_public_all" on public.memes;
create policy "memes_public_all" on public.memes for all using (true) with check (true);

drop policy if exists "reactions_public_all" on public.reactions;
create policy "reactions_public_all" on public.reactions for all using (true) with check (true);

-- Enable realtime on reactions
alter publication supabase_realtime add table public.reactions;

-- Storage bucket (run separately if bucket doesn't exist)
-- insert into storage.buckets (id, name, public) values ('meme-images', 'meme-images', true);

drop policy if exists "meme_images_public_read" on storage.objects;
create policy "meme_images_public_read" on storage.objects
  for select using (bucket_id = 'meme-images');

drop policy if exists "meme_images_public_insert" on storage.objects;
create policy "meme_images_public_insert" on storage.objects
  for insert with check (bucket_id = 'meme-images');
