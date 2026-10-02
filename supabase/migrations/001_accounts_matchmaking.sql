-- Skill Arcade: real accounts + shared matchmaking (Phase 1)
-- Run this in a dedicated Supabase project before filling src/online-config.js.
-- Real money is intentionally NOT part of this migration.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 2 and 24)
);

create unique index if not exists profiles_username_unique_ci
  on public.profiles (lower(username));

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  game_slug text not null,
  region text not null default 'global',
  target_players integer not null,
  status text not null default 'forming'
    check (status in ('forming','ready','started','finished','cancelled')),
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  map_id text,
  game_version text not null default 'v6.2'
);

create index if not exists matches_forming_idx
  on public.matches (game_slug, region, status, created_at);

create table if not exists public.match_players (
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  seat integer not null,
  joined_at timestamptz not null default now(),
  ready boolean not null default false,
  primary key (match_id, user_id),
  unique (match_id, seat)
);

create index if not exists match_players_user_idx
  on public.match_players (user_id, joined_at desc);

create table if not exists public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  game_slug text not null,
  region text not null default 'global',
  status text not null default 'waiting'
    check (status in ('waiting','matched','cancelled','expired')),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists queue_one_active_per_user
  on public.queue_entries (user_id)
  where status in ('waiting','matched');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  final_name text;
  suffix integer := 0;
begin
  base_name := trim(coalesce(new.raw_user_meta_data->>'username',''));
  if char_length(base_name) < 2 then
    base_name := 'Player-' || substr(replace(new.id::text,'-',''),1,6);
  end if;
  base_name := left(regexp_replace(base_name, '[^a-zA-Z0-9 _-]', '', 'g'), 20);
  if char_length(base_name) < 2 then
    base_name := 'Player';
  end if;

  final_name := base_name;
  while exists(select 1 from public.profiles p where lower(p.username)=lower(final_name)) loop
    suffix := suffix + 1;
    final_name := left(base_name, greatest(2, 20 - char_length(suffix::text) - 1)) || '-' || suffix;
  end loop;

  insert into public.profiles(id, username)
  values(new.id, final_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.queue_entries enable row level security;

drop policy if exists "profiles readable by signed in users" on public.profiles;
create policy "profiles readable by signed in users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "matches readable by signed in users" on public.matches;
create policy "matches readable by signed in users"
on public.matches for select
to authenticated
using (true);

drop policy if exists "match players readable by signed in users" on public.match_players;
create policy "match players readable by signed in users"
on public.match_players for select
to authenticated
using (true);

drop policy if exists "queue owner can read" on public.queue_entries;
create policy "queue owner can read"
on public.queue_entries for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.join_matchmaking(
  p_game_slug text,
  p_region text default 'global'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_match_id uuid;
  v_target integer;
  v_count integer;
  v_seat integer;
  v_status text;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  if p_game_slug <> 'obstacle-sprint' then
    raise exception 'online beta currently supports obstacle-sprint only';
  end if;

  p_region := coalesce(nullif(trim(p_region),''),'global');
  v_target := 8;

  -- Serialize queue assignment for this game/region.
  perform pg_advisory_xact_lock(hashtext('skill-arcade:' || p_game_slug || ':' || p_region));

  -- Return the user's existing active queue if one exists.
  select q.match_id into v_match_id
  from public.queue_entries q
  join public.matches m on m.id=q.match_id
  where q.user_id=uid
    and q.status in ('waiting','matched')
    and m.status in ('forming','ready')
  order by q.joined_at desc
  limit 1;

  if v_match_id is null then
    select m.id into v_match_id
    from public.matches m
    where m.game_slug=p_game_slug
      and m.region=p_region
      and m.status='forming'
      and (select count(*) from public.match_players mp where mp.match_id=m.id) < m.target_players
    order by m.created_at
    limit 1
    for update skip locked;

    if v_match_id is null then
      insert into public.matches(game_slug,region,target_players,status)
      values(p_game_slug,p_region,v_target,'forming')
      returning id into v_match_id;
    end if;

    select coalesce(min(gs),1) into v_seat
    from generate_series(1,v_target) gs
    where not exists (
      select 1 from public.match_players mp
      where mp.match_id=v_match_id and mp.seat=gs
    );

    insert into public.match_players(match_id,user_id,seat)
    values(v_match_id,uid,v_seat)
    on conflict (match_id,user_id) do nothing;

    insert into public.queue_entries(user_id,match_id,game_slug,region,status)
    values(uid,v_match_id,p_game_slug,p_region,'waiting')
    on conflict (user_id) where status in ('waiting','matched')
    do update set
      match_id=excluded.match_id,
      game_slug=excluded.game_slug,
      region=excluded.region,
      status='waiting',
      joined_at=now(),
      updated_at=now();
  end if;

  select count(*) into v_count
  from public.match_players
  where match_id=v_match_id;

  if v_count >= v_target then
    update public.matches
      set status='ready', ready_at=coalesce(ready_at,now())
      where id=v_match_id and status='forming';

    update public.queue_entries
      set status='matched', updated_at=now()
      where match_id=v_match_id and status='waiting';
  end if;

  select status into v_status from public.matches where id=v_match_id;

  return jsonb_build_object(
    'match_id',v_match_id,
    'status',v_status,
    'players',v_count,
    'target_players',v_target,
    'game_slug',p_game_slug,
    'region',p_region
  );
end;
$$;

create or replace function public.leave_matchmaking(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_status text;
  v_count integer;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select status into v_status
  from public.matches
  where id=p_match_id
  for update;

  if v_status is null then
    return jsonb_build_object('ok',false,'reason','match_not_found');
  end if;

  if v_status <> 'forming' then
    return jsonb_build_object('ok',false,'reason','match_already_ready');
  end if;

  delete from public.match_players
  where match_id=p_match_id and user_id=uid;

  update public.queue_entries
    set status='cancelled', updated_at=now()
    where match_id=p_match_id and user_id=uid and status='waiting';

  select count(*) into v_count
  from public.match_players
  where match_id=p_match_id;

  if v_count=0 then
    update public.matches
      set status='cancelled'
      where id=p_match_id and status='forming';
  end if;

  return jsonb_build_object('ok',true,'players',v_count);
end;
$$;

create or replace function public.get_match_lobby(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select jsonb_build_object(
    'match_id',m.id,
    'game_slug',m.game_slug,
    'region',m.region,
    'status',m.status,
    'target_players',m.target_players,
    'created_at',m.created_at,
    'players',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'user_id',mp.user_id,
          'username',coalesce(p.username,'Player'),
          'seat',mp.seat,
          'joined_at',mp.joined_at
        )
        order by mp.seat
      )
      from public.match_players mp
      left join public.profiles p on p.id=mp.user_id
      where mp.match_id=m.id
    ),'[]'::jsonb)
  )
  into result
  from public.matches m
  where m.id=p_match_id;

  return result;
end;
$$;

grant execute on function public.join_matchmaking(text,text) to authenticated;
grant execute on function public.leave_matchmaking(uuid) to authenticated;
grant execute on function public.get_match_lobby(uuid) to authenticated;

-- Add the two tables to Supabase Realtime only if they are not already published.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='match_players'
  ) then
    alter publication supabase_realtime add table public.match_players;
  end if;
end $$;
