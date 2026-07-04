-- ============================================================
-- FishLog database schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- PROFILES ---------------------------------------------------
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text default '',
  favorite_species text default '',
  home_state text default '',
  join_date timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- CATCHES -----------------------------------------------------
create table public.catches (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  photo_url text not null,
  species text not null,
  caption text default '',
  rating int not null check (rating between 1 and 5),
  weight numeric,
  length numeric,
  location text default '',
  date_caught date not null,
  created_at timestamptz default now(),
  released boolean default false,
  is_public boolean default true
);
alter table public.catches enable row level security;
create policy "Public catches viewable by everyone, private only by owner" on public.catches
  for select using (is_public = true or owner_id = auth.uid());
create policy "Users can insert their own catches" on public.catches
  for insert with check (owner_id = auth.uid());
create policy "Users can update their own catches" on public.catches
  for update using (owner_id = auth.uid());
create policy "Users can delete their own catches" on public.catches
  for delete using (owner_id = auth.uid());

-- COMMENTS ------------------------------------------------------
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  catch_id uuid references public.catches(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);
alter table public.comments enable row level security;
create policy "Comments viewable by everyone" on public.comments
  for select using (true);
create policy "Users can add comments as themselves" on public.comments
  for insert with check (user_id = auth.uid());
create policy "Users can delete their own comments" on public.comments
  for delete using (user_id = auth.uid());

-- LIKES -----------------------------------------------------
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade not null,
  catch_id uuid references public.catches(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, catch_id)
);
alter table public.likes enable row level security;
create policy "Likes viewable by everyone" on public.likes
  for select using (true);
create policy "Users can like as themselves" on public.likes
  for insert with check (user_id = auth.uid());
create policy "Users can unlike their own like" on public.likes
  for delete using (user_id = auth.uid());

-- FOLLOWS -----------------------------------------------------
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "Follows viewable by everyone" on public.follows
  for select using (true);
create policy "Users can follow as themselves" on public.follows
  for insert with check (follower_id = auth.uid());
create policy "Users can unfollow as themselves" on public.follows
  for delete using (follower_id = auth.uid());

-- NOTIFICATIONS -------------------------------------------------
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'like' | 'comment' | 'follow'
  from_user_id uuid references public.profiles(id) on delete cascade,
  catch_id uuid references public.catches(id) on delete cascade,
  comment_text text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "Users see their own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "Anyone can create a notification for another user" on public.notifications
  for insert with check (true);
create policy "Users can mark their own notifications read" on public.notifications
  for update using (user_id = auth.uid());

-- STORAGE (photos bucket) ----------------------------------------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Photos are publicly readable" on storage.objects
  for select using (bucket_id = 'photos');
create policy "Authenticated users can upload photos" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "Users can update their own photo uploads" on storage.objects
  for update using (bucket_id = 'photos' and owner = auth.uid());
create policy "Users can delete their own photo uploads" on storage.objects
  for delete using (bucket_id = 'photos' and owner = auth.uid());
