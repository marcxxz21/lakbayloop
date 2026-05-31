create table if not exists public.ll_tracking_points (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  route_id uuid references public.ll_saved_routes(id) on delete set null,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  accuracy_m numeric(8,2),
  speed_mps numeric(8,2),
  heading_degrees numeric(6,2),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ll_tracking_points_session_recorded_idx on public.ll_tracking_points(session_id, recorded_at desc);
create index if not exists ll_tracking_points_route_idx on public.ll_tracking_points(route_id);

alter table public.ll_tracking_points enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'll_tracking_points'
      and policyname = 'LakbayLoop session scoped access'
  ) then
    create policy "LakbayLoop session scoped access"
    on public.ll_tracking_points
    for all
    to anon, authenticated
    using (session_id = public.ll_request_session_id())
    with check (session_id = public.ll_request_session_id());
  end if;
end $$;
