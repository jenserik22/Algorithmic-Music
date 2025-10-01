-- Enable required extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type algorithm as enum ('markov', 'cellular_automata', 'l_systems', 'generative_grammar', 'stochastic', 'euclidean');
exception when duplicate_object then null; end $$;

do $$ begin
  create type genre as enum ('classical','rock','electronic','jazz','world','hip_hop','cinematic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complexity as enum ('simple','intermediate','full','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type time_sig as enum ('4/4','3/4','5/4','7/8');
exception when duplicate_object then null; end $$;

do $$ begin
  create type audio_format as enum ('mp3','wav','ogg','flac');
exception when duplicate_object then null; end $$;

-- Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_preference text check (theme_preference in ('light','dark','system')) default 'system',
  visualizer_theme text,
  default_complexity complexity,
  keyboard_shortcuts_version int,
  analytics_opt_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generations
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  seed bigint not null,
  algorithm algorithm not null,
  genre genre not null,
  complexity complexity not null,
  duration_secs int not null check (duration_secs > 0),
  bpm int not null check (bpm between 40 and 240),
  key text not null,
  time_signature time_sig not null default '4/4',
  density real not null check (density >= 0 and density <= 1),
  device_context jsonb,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_idx on public.generations(user_id, created_at desc);

-- Generation parameters
create table if not exists public.generation_parameters (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  parameters jsonb not null
);

-- Optional audio assets metadata (not used in MVP for cloud audio storage)
create table if not exists public.generation_audio_assets (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  format audio_format not null,
  storage_path text not null,
  filesize_bytes bigint,
  bitrate int,
  duration_secs int,
  created_at timestamptz not null default now()
);

-- Folders / Playlists
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists folders_user_idx on public.folders(user_id, created_at desc);

create table if not exists public.folder_items (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references public.folders(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  position smallint,
  added_at timestamptz not null default now()
);

-- Tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (user_id, label)
);

create table if not exists public.generation_tags (
  generation_id uuid not null references public.generations(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (generation_id, tag_id)
);

-- Favorites
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid not null references public.generations(id) on delete cascade,
  favorited_at timestamptz not null default now(),
  primary key (user_id, generation_id)
);

-- Presets
create table if not exists public.presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  algorithm algorithm,
  genre genre,
  complexity complexity,
  parameters jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists presets_user_idx on public.presets(user_id, created_at desc);

create table if not exists public.preset_tags (
  preset_id uuid not null references public.presets(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (preset_id, tag_id)
);

-- Shares (owner-managed; public read semantics can be added later via RPC)
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.presets(id) on delete cascade,
  share_code text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.generations enable row level security;
alter table public.generation_parameters enable row level security;
alter table public.generation_audio_assets enable row level security;
alter table public.folders enable row level security;
alter table public.folder_items enable row level security;
alter table public.tags enable row level security;
alter table public.generation_tags enable row level security;
alter table public.favorites enable row level security;
alter table public.presets enable row level security;
alter table public.preset_tags enable row level security;
alter table public.shares enable row level security;

-- Policies: owner can manage their own rows
-- Profiles
do $$ begin
  create policy profiles_owner_all on public.profiles
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- User settings
do $$ begin
  create policy user_settings_owner_all on public.user_settings
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Generations
do $$ begin
  create policy generations_owner_all on public.generations
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Generation parameters
do $$ begin
  create policy generation_parameters_owner_all on public.generation_parameters
    for all using (exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid()))
    with check (exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- Generation audio assets
do $$ begin
  create policy generation_audio_assets_owner_all on public.generation_audio_assets
    for all using (exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid()))
    with check (exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- Folders
do $$ begin
  create policy folders_owner_all on public.folders
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Folder items (must reference folder and generation owned by user)
do $$ begin
  create policy folder_items_owner_all on public.folder_items
    for all using (
      exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
      and exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
    ) with check (
      exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
      and exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- Tags
do $$ begin
  create policy tags_owner_all on public.tags
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Generation tags
do $$ begin
  create policy generation_tags_owner_all on public.generation_tags
    for all using (
      exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
      and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
    ) with check (
      exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
      and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- Favorites (user can only favorite own generations for MVP)
do $$ begin
  create policy favorites_owner_all on public.favorites
    for all using (
      user_id = auth.uid() and exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
    ) with check (
      user_id = auth.uid() and exists (select 1 from public.generations g where g.id = generation_id and g.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- Presets
do $$ begin
  create policy presets_owner_all on public.presets
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Preset tags
do $$ begin
  create policy preset_tags_owner_all on public.preset_tags
    for all using (
      exists (select 1 from public.presets p where p.id = preset_id and p.user_id = auth.uid())
      and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
    ) with check (
      exists (select 1 from public.presets p where p.id = preset_id and p.user_id = auth.uid())
      and exists (select 1 from public.tags t where t.id = tag_id and t.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;

-- Shares (owner-managed only for MVP)
do $$ begin
  create policy shares_owner_all on public.shares
    for all using (
      exists (select 1 from public.presets p where p.id = preset_id and p.user_id = auth.uid())
    ) with check (
      exists (select 1 from public.presets p where p.id = preset_id and p.user_id = auth.uid())
    );
exception when duplicate_object then null; end $$;
