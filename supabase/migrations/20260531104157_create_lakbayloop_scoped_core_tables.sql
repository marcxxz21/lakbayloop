create extension if not exists pgcrypto;

create or replace function public.ll_request_session_id()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'x-lakbayloop-session', ''),
    nullif(current_setting('request.headers', true)::json ->> 'X-LakbayLoop-Session', '')
  )
$$;

create table if not exists public.ll_app_users (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  full_name text not null default 'Josie Dela Cruz',
  email text,
  school_or_workplace text not null default 'UP Manila',
  preferred_mode text not null default 'Mixed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ll_saved_routes (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  route_name text not null,
  origin_name text not null,
  origin_lat numeric(9,6),
  origin_lng numeric(9,6),
  destination_name text not null,
  destination_lat numeric(9,6),
  destination_lng numeric(9,6),
  preferred_mode text not null default 'Mixed',
  is_favorite boolean not null default false,
  distance_km numeric(8,2) not null default 0,
  estimated_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ll_saved_routes_mode_check check (preferred_mode in ('Walking','Jeepney','Bus','Train','Bike','Car','Mixed'))
);

create table if not exists public.ll_route_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  route_id uuid references public.ll_saved_routes(id) on delete cascade,
  travel_date date not null default current_date,
  actual_duration_minutes integer not null check (actual_duration_minutes > 0),
  crowd_level text not null default 'moderate',
  rating integer not null check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  constraint ll_route_logs_crowd_check check (crowd_level in ('light','moderate','crowded','very crowded')),
  constraint ll_route_logs_actual_duration_reasonable check (actual_duration_minutes <= 300)
);

create table if not exists public.ll_weather_daily (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  route_id uuid references public.ll_saved_routes(id) on delete cascade,
  forecast_date date not null default current_date,
  rain_chance numeric(5,2) not null default 0,
  temperature_c numeric(5,2),
  observed_at timestamptz not null default now(),
  unique (session_id, route_id, forecast_date)
);

create table if not exists public.ll_air_quality_daily (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  route_id uuid references public.ll_saved_routes(id) on delete cascade,
  forecast_date date not null default current_date,
  aqi integer not null default 0,
  label text not null default 'Moderate',
  observed_at timestamptz not null default now(),
  unique (session_id, route_id, forecast_date)
);

create table if not exists public.ll_route_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  route_id uuid references public.ll_saved_routes(id) on delete cascade,
  distance_km numeric(8,2) not null default 0,
  estimated_minutes integer not null default 0,
  provider text not null default 'manual',
  observed_at timestamptz not null default now()
);

create table if not exists public.ll_raw_api_responses (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  source text not null,
  route_id uuid references public.ll_saved_routes(id) on delete set null,
  request_url text,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ll_pipeline_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  source text not null,
  status text not null,
  rows_inserted integer not null default 0,
  executed_at timestamptz not null default now(),
  error_message text,
  constraint ll_pipeline_logs_status_check check (status in ('Success','Partial','Failed'))
);

create index if not exists ll_saved_routes_session_idx on public.ll_saved_routes(session_id);
create index if not exists ll_saved_routes_search_idx on public.ll_saved_routes using gin (to_tsvector('simple', route_name || ' ' || origin_name || ' ' || destination_name || ' ' || preferred_mode));
create index if not exists ll_route_logs_session_idx on public.ll_route_logs(session_id);
create index if not exists ll_route_logs_route_idx on public.ll_route_logs(route_id);
create index if not exists ll_pipeline_logs_session_idx on public.ll_pipeline_logs(session_id, executed_at desc);
create index if not exists ll_weather_daily_route_idx on public.ll_weather_daily(route_id);
create index if not exists ll_air_quality_daily_route_idx on public.ll_air_quality_daily(route_id);
create index if not exists ll_route_snapshots_route_idx on public.ll_route_snapshots(route_id);
create index if not exists ll_raw_api_responses_route_idx on public.ll_raw_api_responses(route_id);

alter table public.ll_app_users enable row level security;
alter table public.ll_saved_routes enable row level security;
alter table public.ll_route_logs enable row level security;
alter table public.ll_weather_daily enable row level security;
alter table public.ll_air_quality_daily enable row level security;
alter table public.ll_route_snapshots enable row level security;
alter table public.ll_raw_api_responses enable row level security;
alter table public.ll_pipeline_logs enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['ll_app_users','ll_saved_routes','ll_route_logs','ll_weather_daily','ll_air_quality_daily','ll_route_snapshots','ll_raw_api_responses','ll_pipeline_logs'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = tbl and policyname = 'LakbayLoop session scoped access') then
      execute format('create policy "LakbayLoop session scoped access" on public.%I for all to anon, authenticated using (session_id = public.ll_request_session_id()) with check (session_id = public.ll_request_session_id())', tbl);
    end if;
  end loop;
end $$;
