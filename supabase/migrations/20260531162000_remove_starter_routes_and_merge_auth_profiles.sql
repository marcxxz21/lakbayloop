with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_saved_routes route
set session_id = profile_session_map.auth_session_id
from profile_session_map
where route.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_route_logs log
set session_id = profile_session_map.auth_session_id
from profile_session_map
where log.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_tracking_points point
set session_id = profile_session_map.auth_session_id
from profile_session_map
where point.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_weather_daily weather
set session_id = profile_session_map.auth_session_id
from profile_session_map
where weather.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_air_quality_daily air
set session_id = profile_session_map.auth_session_id
from profile_session_map
where air.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_route_snapshots snapshot
set session_id = profile_session_map.auth_session_id
from profile_session_map
where snapshot.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_raw_api_responses raw
set session_id = profile_session_map.auth_session_id
from profile_session_map
where raw.session_id = profile_session_map.old_session_id;

with profile_session_map as (
  select
    app.session_id as old_session_id,
    auth_user.id::text as auth_session_id
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
    and app.session_id <> auth_user.id::text
)
update public.ll_pipeline_logs pipeline
set session_id = profile_session_map.auth_session_id
from profile_session_map
where pipeline.session_id = profile_session_map.old_session_id;

with latest_profiles as (
  select
    auth_user.id::text as session_id,
    app.full_name,
    app.email,
    app.school_or_workplace,
    app.preferred_mode,
    app.created_at,
    app.updated_at,
    row_number() over (partition by auth_user.id order by app.updated_at desc) as rank
  from public.ll_app_users app
  join auth.users auth_user on lower(auth_user.email) = lower(app.email)
  where app.email is not null
)
insert into public.ll_app_users (session_id, full_name, email, school_or_workplace, preferred_mode, created_at, updated_at)
select session_id, full_name, email, school_or_workplace, preferred_mode, created_at, updated_at
from latest_profiles
where rank = 1
on conflict (session_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  school_or_workplace = excluded.school_or_workplace,
  preferred_mode = excluded.preferred_mode,
  updated_at = excluded.updated_at;

delete from public.ll_app_users app
using auth.users auth_user
where app.email is not null
  and lower(auth_user.email) = lower(app.email)
  and app.session_id <> auth_user.id::text;

delete from public.ll_saved_routes
where route_name in ('Home -> School', 'Campus -> Work', 'Home -> UP Manila', 'Home -> MRT North')
  and origin_name in ('Home', 'Campus')
  and destination_name in ('School', 'Work', 'UP Manila', 'MRT North Avenue');

delete from public.ll_saved_routes
where distance_km = 0
  and estimated_minutes = 0
  and origin_lat is null
  and origin_lng is null
  and destination_lat is null
  and destination_lng is null;
