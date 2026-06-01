alter table public.ll_saved_routes
add column if not exists preferred_modes text[] not null default array['Mixed']::text[];

update public.ll_saved_routes
set preferred_modes = array[preferred_mode]
where preferred_modes is null
   or array_length(preferred_modes, 1) is null
   or (preferred_modes = array['Mixed']::text[] and preferred_mode <> 'Mixed');

alter table public.ll_saved_routes
drop constraint if exists ll_saved_routes_preferred_modes_check;

alter table public.ll_saved_routes
add constraint ll_saved_routes_preferred_modes_check
check (
  preferred_modes <@ array['Walking','Jeepney','Bus','Train','Bike','Car','Mixed']::text[]
  and array_length(preferred_modes, 1) >= 1
);

alter table public.ll_route_logs
add column if not exists preferred_modes text[] not null default array['Mixed']::text[];

update public.ll_route_logs log
set preferred_modes = coalesce(route.preferred_modes, array[route.preferred_mode], array['Mixed']::text[])
from public.ll_saved_routes route
where log.route_id = route.id
  and (
    log.preferred_modes is null
    or array_length(log.preferred_modes, 1) is null
    or log.preferred_modes = array['Mixed']::text[]
  );

alter table public.ll_route_logs
drop constraint if exists ll_route_logs_preferred_modes_check;

alter table public.ll_route_logs
add constraint ll_route_logs_preferred_modes_check
check (
  preferred_modes <@ array['Walking','Jeepney','Bus','Train','Bike','Car','Mixed']::text[]
  and array_length(preferred_modes, 1) >= 1
);
