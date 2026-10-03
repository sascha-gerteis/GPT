-- Skill Arcade V6.6: real-wallet / escrow / live matchmaking schema.
--
-- IMPORTANT:
-- * This migration creates the production data model, but all cash gates start OFF.
-- * Never store wallet private keys, seed phrases or provider signing secrets here.
-- * The service-role backend/indexer is the only component allowed to verify deposits,
--   withdrawals, escrow funding and settlements.

create extension if not exists pgcrypto;

create table if not exists public.live_runtime (
  id boolean primary key default true check (id = true),
  environment text not null default 'setup' check (environment in ('setup','testnet','production')),
  cash_mode_enabled boolean not null default false,
  wallet_provisioning_enabled boolean not null default false,
  deposits_enabled boolean not null default false,
  withdrawals_enabled boolean not null default false,
  paid_matchmaking_enabled boolean not null default false,
  chain_id bigint,
  stablecoin_symbol text not null default 'USDC',
  stablecoin_address text,
  escrow_contract_address text,
  updated_at timestamptz not null default now()
);
insert into public.live_runtime(id) values(true) on conflict (id) do nothing;

create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_type text not null check (wallet_type in ('embedded','external')),
  provider text not null,
  address text not null,
  chain_id bigint not null,
  status text not null default 'active' check (status in ('provisioning','active','blocked','closed')),
  provider_wallet_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(chain_id,address)
);
create index if not exists wallet_accounts_user_idx on public.wallet_accounts(user_id,created_at desc);

create table if not exists public.wallet_balances (
  wallet_id uuid not null references public.wallet_accounts(id) on delete cascade,
  token_address text not null,
  symbol text not null,
  decimals integer not null,
  available_atomic numeric(78,0) not null default 0 check (available_atomic >= 0),
  locked_atomic numeric(78,0) not null default 0 check (locked_atomic >= 0),
  pending_atomic numeric(78,0) not null default 0 check (pending_atomic >= 0),
  block_number numeric(78,0),
  updated_at timestamptz not null default now(),
  primary key(wallet_id,token_address)
);

create table if not exists public.wallet_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallet_accounts(id) on delete cascade,
  chain_id bigint not null,
  token_address text not null,
  tx_hash text not null,
  log_index integer not null default 0,
  from_address text,
  amount_atomic numeric(78,0) not null check (amount_atomic > 0),
  confirmations integer not null default 0,
  status text not null default 'detected' check (status in ('detected','confirming','confirmed','rejected','reorged')),
  detected_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unique(chain_id,tx_hash,log_index)
);
create index if not exists wallet_deposits_user_idx on public.wallet_deposits(user_id,detected_at desc);

create table if not exists public.wallet_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallet_accounts(id) on delete cascade,
  chain_id bigint not null,
  token_address text not null,
  destination_address text not null,
  amount_atomic numeric(78,0) not null check (amount_atomic > 0),
  status text not null default 'requested' check (status in ('requested','review','approved','broadcast','confirmed','rejected','cancelled','failed')),
  tx_hash text,
  risk_reference text,
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wallet_withdrawals_user_idx on public.wallet_withdrawals(user_id,requested_at desc);

-- A paid queue entry is funded before it is consumed by matchmaking.
-- The backend creates this only after it verifies the escrow transaction/event.
create table if not exists public.entry_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_slug text not null,
  region text not null default 'global',
  wallet_address text not null,
  chain_id bigint not null,
  token_address text not null,
  entry_amount_atomic numeric(78,0) not null check (entry_amount_atomic > 0),
  match_id uuid references public.matches(id) on delete cascade,
  escrow_tx_hash text,
  escrow_event_index integer not null default 0,
  status text not null default 'quoted' check (status in ('quoted','verified','consumed','refundable','refunded','expired','rejected')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  consumed_at timestamptz,
  unique(chain_id,escrow_tx_hash,escrow_event_index)
);
create index if not exists entry_reservations_user_idx on public.entry_reservations(user_id,status,created_at desc);

alter table public.matches add column if not exists entry_amount_atomic numeric(78,0) not null default 0;
alter table public.matches add column if not exists currency text not null default 'FREE';
alter table public.matches add column if not exists chain_id bigint;
alter table public.matches add column if not exists escrow_contract_address text;
alter table public.matches add column if not exists server_region text;
alter table public.matches add column if not exists authoritative_server_id text;
alter table public.matches add column if not exists result_hash text;
alter table public.matches add column if not exists settlement_tx_hash text;

alter table public.match_players add column if not exists entry_reservation_id uuid references public.entry_reservations(id);
alter table public.match_players add column if not exists connected_at timestamptz;
alter table public.match_players add column if not exists disconnected_at timestamptz;
alter table public.match_players add column if not exists finish_place integer;

create table if not exists public.match_server_tickets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists match_server_tickets_match_idx on public.match_server_tickets(match_id,user_id);

create table if not exists public.match_results (
  match_id uuid primary key references public.matches(id) on delete cascade,
  game_slug text not null,
  game_version text not null,
  map_id text,
  authoritative_server_id text not null,
  placements jsonb not null,
  result_hash text not null unique,
  signer_address text,
  signature text,
  status text not null default 'verified' check (status in ('pending','verified','settling','settled','disputed','void')),
  settlement_tx_hash text,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','warning','high','critical')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS: users can read their own money records. They cannot mark anything verified.
alter table public.live_runtime enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_balances enable row level security;
alter table public.wallet_deposits enable row level security;
alter table public.wallet_withdrawals enable row level security;
alter table public.entry_reservations enable row level security;
alter table public.match_server_tickets enable row level security;
alter table public.match_results enable row level security;
alter table public.security_events enable row level security;

drop policy if exists "runtime readable" on public.live_runtime;
drop policy if exists "own wallets readable" on public.wallet_accounts;
drop policy if exists "own balances readable" on public.wallet_balances;
drop policy if exists "own deposits readable" on public.wallet_deposits;
drop policy if exists "own withdrawals readable" on public.wallet_withdrawals;
drop policy if exists "own reservations readable" on public.entry_reservations;
drop policy if exists "own server tickets readable" on public.match_server_tickets;
drop policy if exists "participant results readable" on public.match_results;
drop policy if exists "own security events readable" on public.security_events;

create policy "runtime readable" on public.live_runtime for select to authenticated using (true);
create policy "own wallets readable" on public.wallet_accounts for select to authenticated using (auth.uid()=user_id);
create policy "own balances readable" on public.wallet_balances for select to authenticated using (exists(select 1 from public.wallet_accounts w where w.id=wallet_id and w.user_id=auth.uid()));
create policy "own deposits readable" on public.wallet_deposits for select to authenticated using (auth.uid()=user_id);
create policy "own withdrawals readable" on public.wallet_withdrawals for select to authenticated using (auth.uid()=user_id);
create policy "own reservations readable" on public.entry_reservations for select to authenticated using (auth.uid()=user_id);
create policy "own server tickets readable" on public.match_server_tickets for select to authenticated using (auth.uid()=user_id);
create policy "participant results readable" on public.match_results for select to authenticated using (exists(select 1 from public.match_players mp where mp.match_id=match_results.match_id and mp.user_id=auth.uid()));
create policy "own security events readable" on public.security_events for select to authenticated using (auth.uid()=user_id);

-- Read-only wallet summary. Actual chain truth is written by the backend/indexer.
create or replace function public.get_wallet_summary()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then raise exception 'authentication required'; end if;
  select jsonb_build_object(
    'wallet',jsonb_build_object('id',w.id,'type',w.wallet_type,'provider',w.provider,'address',w.address,'chainId',w.chain_id,'status',w.status),
    'balance',coalesce((
      select jsonb_build_object(
        'symbol',b.symbol,
        'decimals',b.decimals,
        'availableAtomic',b.available_atomic::text,
        'lockedAtomic',b.locked_atomic::text,
        'pendingAtomic',b.pending_atomic::text,
        'availableFormatted',(b.available_atomic / power(10::numeric,b.decimals))::text,
        'lockedFormatted',(b.locked_atomic / power(10::numeric,b.decimals))::text,
        'pendingFormatted',(b.pending_atomic / power(10::numeric,b.decimals))::text
      ) from public.wallet_balances b where b.wallet_id=w.id order by b.updated_at desc limit 1
    ),'{}'::jsonb)
  ) into result
  from public.wallet_accounts w
  where w.user_id=uid and w.status in ('provisioning','active')
  order by (w.wallet_type='embedded') desc,w.created_at desc
  limit 1;
  return coalesce(result,jsonb_build_object('wallet',null,'balance',jsonb_build_object()));
end;
$$;
grant execute on function public.get_wallet_summary() to authenticated;


-- Backend-only paid-match quote. This reserves a seat before the on-chain join transaction.
create or replace function public.prepare_paid_match(
  p_user_id uuid, p_game_slug text, p_region text, p_wallet_address text,
  p_entry_amount_atomic numeric, p_currency text, p_chain_id bigint,
  p_token_address text, p_escrow_address text, p_ttl_seconds integer default 300
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  rt public.live_runtime%rowtype; v_match_id uuid; v_reservation_id uuid; v_active integer; v_created boolean := false;
begin
  select * into rt from public.live_runtime where id=true;
  if not coalesce(rt.cash_mode_enabled,false) or not coalesce(rt.paid_matchmaking_enabled,false) then raise exception 'paid matchmaking disabled'; end if;
  if p_entry_amount_atomic <= 0 then raise exception 'entry amount must be positive'; end if;
  if p_game_slug not in ('floor-breaker','obstacle-sprint','knockout','bomb-tag','falling-tiles','red-light-run','coin-rush','safe-zone','wall-dodge','maze-rush','meteor-dodge') then raise exception 'unsupported game'; end if;
  p_region := coalesce(nullif(trim(p_region),''),'global');
  perform pg_advisory_xact_lock(hashtext('skill-arcade-paid:'||p_game_slug||':'||p_region||':'||p_entry_amount_atomic::text));
  update public.entry_reservations set status='expired' where status='quoted' and expires_at<=now();
  select m.id into v_match_id from public.matches m
    where m.game_slug=p_game_slug and m.region=p_region and m.status='forming' and m.entry_amount_atomic=p_entry_amount_atomic and m.currency=upper(p_currency)
      and (select count(*) from public.entry_reservations r where r.match_id=m.id and r.status in ('quoted','verified','consumed') and r.expires_at>now()) < m.target_players
    order by m.created_at limit 1 for update skip locked;
  if v_match_id is null then
    insert into public.matches(game_slug,region,target_players,status,game_version,entry_amount_atomic,currency,chain_id,escrow_contract_address)
      values(p_game_slug,p_region,12,'forming','v6.6',p_entry_amount_atomic,upper(p_currency),p_chain_id,p_escrow_address) returning id into v_match_id;
    v_created := true;
  end if;
  insert into public.entry_reservations(user_id,game_slug,region,wallet_address,chain_id,token_address,entry_amount_atomic,match_id,status,expires_at)
    values(p_user_id,p_game_slug,p_region,p_wallet_address,p_chain_id,p_token_address,p_entry_amount_atomic,v_match_id,'quoted',now()+make_interval(secs=>greatest(60,p_ttl_seconds)))
    returning id into v_reservation_id;
  return jsonb_build_object('match_id',v_match_id,'reservation_id',v_reservation_id,'created_match',v_created,'expires_at',(now()+make_interval(secs=>greatest(60,p_ttl_seconds))));
end; $$;
revoke all on function public.prepare_paid_match(uuid,text,text,text,numeric,text,bigint,text,text,integer) from public,anon,authenticated;
grant execute on function public.prepare_paid_match(uuid,text,text,text,numeric,text,bigint,text,text,integer) to service_role;

-- Called only after the backend has independently verified the escrow EntryLocked event.
create or replace function public.confirm_paid_entry(p_reservation_id uuid,p_tx_hash text,p_event_index integer default 0)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  r public.entry_reservations%rowtype; v_seat integer; v_count integer; v_target integer;
begin
  select * into r from public.entry_reservations where id=p_reservation_id for update;
  if r.id is null or r.status<>'quoted' or r.expires_at<=now() then raise exception 'reservation invalid'; end if;
  update public.entry_reservations set status='verified',escrow_tx_hash=p_tx_hash,escrow_event_index=p_event_index where id=r.id;
  select target_players into v_target from public.matches where id=r.match_id for update;
  select min(gs) into v_seat from generate_series(1,v_target) gs where not exists(select 1 from public.match_players mp where mp.match_id=r.match_id and mp.seat=gs);
  if v_seat is null then raise exception 'match full'; end if;
  insert into public.match_players(match_id,user_id,seat,entry_reservation_id) values(r.match_id,r.user_id,v_seat,r.id) on conflict(match_id,user_id) do nothing;
  insert into public.queue_entries(user_id,match_id,game_slug,region,status) values(r.user_id,r.match_id,r.game_slug,r.region,'waiting')
    on conflict(user_id) where status in ('waiting','matched') do update set match_id=excluded.match_id,game_slug=excluded.game_slug,region=excluded.region,status='waiting',joined_at=now(),updated_at=now();
  update public.entry_reservations set status='consumed',consumed_at=now() where id=r.id;
  select count(*) into v_count from public.match_players where match_id=r.match_id;
  if v_count>=v_target then
    update public.matches set status='ready',ready_at=coalesce(ready_at,now()) where id=r.match_id and status='forming';
    update public.queue_entries set status='matched',updated_at=now() where match_id=r.match_id and status='waiting';
  end if;
  return jsonb_build_object('match_id',r.match_id,'players',v_count,'target_players',v_target,'status',(select status from public.matches where id=r.match_id));
end; $$;
revoke all on function public.confirm_paid_entry(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.confirm_paid_entry(uuid,text,integer) to service_role;

-- Shared free/paid matchmaking RPC. Paid joins require a server-verified reservation.
create or replace function public.join_matchmaking_v2(
  p_game_slug text,
  p_region text default 'global',
  p_entry_amount_atomic numeric default 0,
  p_currency text default 'FREE',
  p_entry_reservation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  v_match_id uuid;
  v_target integer := 12;
  v_count integer;
  v_seat integer;
  v_status text;
  rt public.live_runtime%rowtype;
  res public.entry_reservations%rowtype;
begin
  if uid is null then raise exception 'authentication required'; end if;
  if p_game_slug not in ('floor-breaker','obstacle-sprint','knockout','bomb-tag','falling-tiles','red-light-run','coin-rush','safe-zone','wall-dodge','maze-rush','meteor-dodge') then
    raise exception 'unsupported game';
  end if;
  p_region := coalesce(nullif(trim(p_region),''),'global');
  p_currency := upper(coalesce(nullif(trim(p_currency),''),'FREE'));
  select * into rt from public.live_runtime where id=true;

  if p_entry_amount_atomic > 0 then
    if not coalesce(rt.cash_mode_enabled,false) or not coalesce(rt.paid_matchmaking_enabled,false) then
      raise exception 'paid matchmaking disabled';
    end if;
    if p_entry_reservation_id is null then raise exception 'verified entry reservation required'; end if;
    select * into res from public.entry_reservations where id=p_entry_reservation_id and user_id=uid for update;
    if res.id is null or res.status <> 'verified' or res.expires_at <= now() then raise exception 'entry reservation invalid'; end if;
    if res.game_slug <> p_game_slug or res.entry_amount_atomic <> p_entry_amount_atomic then raise exception 'entry reservation mismatch'; end if;
  end if;

  perform pg_advisory_xact_lock(hashtext('skill-arcade-v2:'||p_game_slug||':'||p_region||':'||p_currency||':'||p_entry_amount_atomic::text));

  select m.id into v_match_id
  from public.matches m
  where m.game_slug=p_game_slug and m.region=p_region and m.status='forming'
    and m.entry_amount_atomic=p_entry_amount_atomic and m.currency=p_currency
    and (select count(*) from public.match_players mp where mp.match_id=m.id) < m.target_players
  order by m.created_at limit 1 for update skip locked;

  if v_match_id is null then
    insert into public.matches(game_slug,region,target_players,status,game_version,entry_amount_atomic,currency,chain_id,escrow_contract_address)
    values(p_game_slug,p_region,v_target,'forming','v6.6',p_entry_amount_atomic,p_currency,rt.chain_id,rt.escrow_contract_address)
    returning id into v_match_id;
  end if;

  if exists(select 1 from public.match_players where match_id=v_match_id and user_id=uid) then
    -- idempotent retry
    null;
  else
    select min(gs) into v_seat from generate_series(1,v_target) gs
      where not exists(select 1 from public.match_players mp where mp.match_id=v_match_id and mp.seat=gs);
    insert into public.match_players(match_id,user_id,seat,entry_reservation_id) values(v_match_id,uid,v_seat,p_entry_reservation_id);
    if p_entry_reservation_id is not null then
      update public.entry_reservations set status='consumed',consumed_at=now() where id=p_entry_reservation_id;
    end if;
  end if;

  insert into public.queue_entries(user_id,match_id,game_slug,region,status)
  values(uid,v_match_id,p_game_slug,p_region,'waiting')
  on conflict (user_id) where status in ('waiting','matched')
  do update set match_id=excluded.match_id,game_slug=excluded.game_slug,region=excluded.region,status='waiting',joined_at=now(),updated_at=now();

  select count(*) into v_count from public.match_players where match_id=v_match_id;
  if v_count >= v_target then
    update public.matches set status='ready',ready_at=coalesce(ready_at,now()) where id=v_match_id and status='forming';
    update public.queue_entries set status='matched',updated_at=now() where match_id=v_match_id and status='waiting';
  end if;
  select status into v_status from public.matches where id=v_match_id;
  return jsonb_build_object('match_id',v_match_id,'status',v_status,'players',v_count,'target_players',v_target,'entry_amount_atomic',p_entry_amount_atomic::text,'currency',p_currency);
end;
$$;
grant execute on function public.join_matchmaking_v2(text,text,numeric,text,uuid) to authenticated;

-- Realtime publications used by account wallet/match UI.
do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='wallet_balances') then alter publication supabase_realtime add table public.wallet_balances; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='wallet_deposits') then alter publication supabase_realtime add table public.wallet_deposits; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='wallet_withdrawals') then alter publication supabase_realtime add table public.wallet_withdrawals; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='match_results') then alter publication supabase_realtime add table public.match_results; end if;
end $$;

-- Service-role variants use an explicit user id because service-role RPC calls do not
-- carry the end user's auth.uid(). These functions are NOT granted to browser roles.
create or replace function public.join_matchmaking_service(
  p_user_id uuid,
  p_game_slug text,
  p_region text default 'global'
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_match_id uuid; v_target integer := 12; v_count integer; v_seat integer; v_status text;
begin
  if p_user_id is null then raise exception 'user required'; end if;
  if p_game_slug not in ('floor-breaker','obstacle-sprint','knockout','bomb-tag','falling-tiles','red-light-run','coin-rush','safe-zone','wall-dodge','maze-rush','meteor-dodge') then raise exception 'unsupported game'; end if;
  p_region := coalesce(nullif(trim(p_region),''),'global');
  perform pg_advisory_xact_lock(hashtext('skill-arcade-free:'||p_game_slug||':'||p_region));
  select m.id into v_match_id from public.matches m
    where m.game_slug=p_game_slug and m.region=p_region and m.status='forming' and m.entry_amount_atomic=0 and m.currency='FREE'
      and (select count(*) from public.match_players mp where mp.match_id=m.id) < m.target_players
    order by m.created_at limit 1 for update skip locked;
  if v_match_id is null then
    insert into public.matches(game_slug,region,target_players,status,game_version,entry_amount_atomic,currency)
      values(p_game_slug,p_region,v_target,'forming','v6.6',0,'FREE') returning id into v_match_id;
  end if;
  if not exists(select 1 from public.match_players where match_id=v_match_id and user_id=p_user_id) then
    select min(gs) into v_seat from generate_series(1,v_target) gs where not exists(select 1 from public.match_players mp where mp.match_id=v_match_id and mp.seat=gs);
    insert into public.match_players(match_id,user_id,seat) values(v_match_id,p_user_id,v_seat);
  end if;
  insert into public.queue_entries(user_id,match_id,game_slug,region,status) values(p_user_id,v_match_id,p_game_slug,p_region,'waiting')
    on conflict(user_id) where status in ('waiting','matched') do update set match_id=excluded.match_id,game_slug=excluded.game_slug,region=excluded.region,status='waiting',joined_at=now(),updated_at=now();
  select count(*) into v_count from public.match_players where match_id=v_match_id;
  if v_count>=v_target then
    update public.matches set status='ready',ready_at=coalesce(ready_at,now()) where id=v_match_id and status='forming';
    update public.queue_entries set status='matched',updated_at=now() where match_id=v_match_id and status='waiting';
  end if;
  select status into v_status from public.matches where id=v_match_id;
  return jsonb_build_object('match_id',v_match_id,'status',v_status,'players',v_count,'target_players',v_target,'entry_amount_atomic','0','currency','FREE');
end; $$;
revoke all on function public.join_matchmaking_service(uuid,text,text) from public,anon,authenticated;
grant execute on function public.join_matchmaking_service(uuid,text,text) to service_role;

create or replace function public.leave_matchmaking_service(p_user_id uuid,p_match_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_status text; v_count integer;
begin
  select status into v_status from public.matches where id=p_match_id for update;
  if v_status is null then return jsonb_build_object('ok',false,'reason','match_not_found'); end if;
  if v_status <> 'forming' then return jsonb_build_object('ok',false,'reason','match_already_ready'); end if;
  delete from public.match_players where match_id=p_match_id and user_id=p_user_id;
  update public.queue_entries set status='cancelled',updated_at=now() where match_id=p_match_id and user_id=p_user_id and status='waiting';
  select count(*) into v_count from public.match_players where match_id=p_match_id;
  if v_count=0 then update public.matches set status='cancelled' where id=p_match_id and status='forming'; end if;
  return jsonb_build_object('ok',true,'players',v_count);
end; $$;
revoke all on function public.leave_matchmaking_service(uuid,uuid) from public,anon,authenticated;
grant execute on function public.leave_matchmaking_service(uuid,uuid) to service_role;
