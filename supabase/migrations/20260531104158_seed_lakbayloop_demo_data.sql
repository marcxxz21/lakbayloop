insert into public.ll_app_users (session_id, full_name, email, school_or_workplace, preferred_mode)
values ('demo', 'Josie Dela Cruz', 'josie@example.com', 'UP Manila', 'Mixed')
on conflict (session_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  school_or_workplace = excluded.school_or_workplace,
  preferred_mode = excluded.preferred_mode,
  updated_at = now();

with seed_routes as (
  select * from (values
    ('Home -> UP Manila','Home',14.676000,121.043000,'UP Manila',14.578000,120.985000,'Walking',true,3.20,28),
    ('Campus -> Work','Campus',14.583000,120.986000,'Work',14.604000,121.020000,'Jeepney',false,5.80,42),
    ('Home -> MRT North','Home',14.671000,121.035000,'MRT North Avenue',14.654000,121.033000,'Train',true,7.10,35)
  ) as r(route_name, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, preferred_mode, is_favorite, distance_km, estimated_minutes)
)
insert into public.ll_saved_routes (session_id, route_name, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, preferred_mode, is_favorite, distance_km, estimated_minutes)
select 'demo', route_name, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng, preferred_mode, is_favorite, distance_km, estimated_minutes
from seed_routes
where not exists (
  select 1 from public.ll_saved_routes existing
  where existing.session_id = 'demo' and existing.route_name = seed_routes.route_name
);

insert into public.ll_route_logs (session_id, route_id, travel_date, actual_duration_minutes, crowd_level, rating, notes)
select 'demo', r.id, current_date, 31, 'moderate', 4, 'Light rain near Taft.'
from public.ll_saved_routes r
where r.session_id = 'demo' and r.route_name = 'Home -> UP Manila'
and not exists (select 1 from public.ll_route_logs l where l.session_id = 'demo' and l.route_id = r.id and l.travel_date = current_date and l.notes = 'Light rain near Taft.');

insert into public.ll_route_logs (session_id, route_id, travel_date, actual_duration_minutes, crowd_level, rating, notes)
select 'demo', r.id, current_date - interval '1 day', 46, 'crowded', 3, 'Long queue at the terminal.'
from public.ll_saved_routes r
where r.session_id = 'demo' and r.route_name = 'Campus -> Work'
and not exists (select 1 from public.ll_route_logs l where l.session_id = 'demo' and l.route_id = r.id and l.travel_date = current_date - interval '1 day' and l.notes = 'Long queue at the terminal.');

insert into public.ll_route_logs (session_id, route_id, travel_date, actual_duration_minutes, crowd_level, rating, notes)
select 'demo', r.id, current_date - interval '2 days', 35, 'light', 5, 'Fast transfer.'
from public.ll_saved_routes r
where r.session_id = 'demo' and r.route_name = 'Home -> MRT North'
and not exists (select 1 from public.ll_route_logs l where l.session_id = 'demo' and l.route_id = r.id and l.travel_date = current_date - interval '2 days' and l.notes = 'Fast transfer.');

insert into public.ll_pipeline_logs (session_id, source, status, rows_inserted, executed_at, error_message)
select * from (values
  ('demo','open_meteo_weather','Success',3, now() - interval '8 minutes', null),
  ('demo','open_meteo_air_quality','Success',12, now() - interval '6 minutes', null),
  ('demo','osrm_route','Partial',832, now() - interval '4 minutes', '2 routes skipped'),
  ('demo','manual_refresh_test','Failed',0, now() - interval '2 minutes', 'Connection timeout')
) as p(session_id, source, status, rows_inserted, executed_at, error_message)
where not exists (select 1 from public.ll_pipeline_logs l where l.session_id = 'demo');
