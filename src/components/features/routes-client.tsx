"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, Filter, MapPin, Trash2, X } from "lucide-react";
import { AddRouteForm } from "@/components/commute/add-route-form";
import { RouteCard } from "@/components/commute/route-card";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui-custom/search-input";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { apiFetch } from "@/lib/api-client";
import { formatModes } from "@/lib/commute-calculations";
import { cn } from "@/lib/utils";
import type { PreferredMode, SavedRoute } from "@/lib/types";

type RouteFilter = "All" | "Favorites" | PreferredMode;

const routeFilterOptions: RouteFilter[] = ["All", "Favorites", "Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"];

export function RoutesPageClient() {
  const searchParams = useSearchParams();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<SavedRoute | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [desktopDetailsOpen, setDesktopDetailsOpen] = useState(false);
  const [mobileLogSignal, setMobileLogSignal] = useState<number | undefined>(undefined);
  const [desktopLogSignal, setDesktopLogSignal] = useState<number | undefined>(undefined);
  const [routeFilter, setRouteFilter] = useState<RouteFilter>("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleRoutes = routes.filter((route) => {
    if (routeFilter === "All") return true;
    if (routeFilter === "Favorites") return route.is_favorite;
    return (route.preferred_modes?.length ? route.preferred_modes : [route.preferred_mode]).includes(routeFilter);
  });

  async function loadRoutes(search = query) {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<{ routes: SavedRoute[] }>(`/api/routes${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      setRoutes(result.routes);
      setSelected((current) => (current && result.routes.find((route) => route.id === current.id)) || (result.routes[0] ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load routes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => loadRoutes(query), 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const mobile = (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-white/38">Saved commutes</p>
          <h1 className="font-heading text-3xl font-black">My Routes</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="relative">
            <Button size="icon" variant="secondary" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen} aria-haspopup="menu" aria-label="Filter routes">
              <Filter className="size-4" />
            </Button>
            {filterOpen ? (
              <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-white/[0.08] bg-[#11161f] p-2 shadow-panel" role="menu">
                {routeFilterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/58 transition hover:bg-white/[0.06] hover:text-white",
                      routeFilter === option && "bg-[var(--blue-soft)] text-white"
                    )}
                    onClick={() => {
                      setRouteFilter(option);
                      setFilterOpen(false);
                    }}
                    role="menuitemradio"
                    aria-checked={routeFilter === option}
                  >
                    <span>{option}</span>
                    {routeFilter === option ? <span className="size-2 rounded-full bg-blue" /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <AddRouteForm onSaved={() => loadRoutes()} />
        </div>
      </header>
      <form onSubmit={(event) => {
        event.preventDefault();
        loadRoutes(query);
      }}>
        <SearchInput className="h-12 w-full" value={query} onChange={setQuery} submitLabel="Search routes" />
      </form>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <div className="space-y-3">
        {loading ? <p className="text-sm text-white/45">Loading routes...</p> : visibleRoutes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            onSelect={(item) => {
              setFilterOpen(false);
              setSelected(item);
              setMobileDetailsOpen(true);
            }}
            onLog={(item) => {
              setFilterOpen(false);
              setSelected(item);
              setMobileLogSignal((signal) => (signal ?? 0) + 1);
            }}
            onToggleFavorite={toggleFavorite}
            onDelete={deleteRoute}
            deleting={deletingRouteId === route.id}
          />
        ))}
        {!loading && !visibleRoutes.length ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4 text-sm text-white/48">No routes match this filter.</p> : null}
      </div>
      <RouteLogForm
        routes={routes}
        selectedRouteId={selected?.id}
        openSignal={mobileLogSignal}
        hideTrigger
        onSaved={() => loadRoutes()}
      />
      {selected && mobileDetailsOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end bg-bg/80 backdrop-blur-md lg:hidden">
          <section className="max-h-[82vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/35">Route details</p>
                <h2 className="mt-1 truncate font-heading text-xl font-black">{selected.route_name}</h2>
              </div>
              <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setMobileDetailsOpen(false)} aria-label="Close route details">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4">
              <StatusBadge status={selected.is_favorite ? "Good" : "Moderate"} />
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/62">
              <div className="rounded-2xl bg-white/[0.035] p-3">
                <span className="flex items-center gap-2 text-xs text-white/35"><MapPin className="size-4 text-blue" /> Origin</span>
                <p className="mt-2 leading-6 text-white/78">{selected.origin_name}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-3">
                <span className="flex items-center gap-2 text-xs text-white/35"><MapPin className="size-4 text-teal" /> Destination</span>
                <p className="mt-2 leading-6 text-white/78">{selected.destination_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/[0.035] p-3">
                  <p className="text-xs text-white/35">Mode</p>
                  <p className="mt-1 font-heading text-base font-black text-white">{formatModes(selected.preferred_modes, selected.preferred_mode)}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.035] p-3">
                  <p className="flex items-center gap-2 text-xs text-white/35"><Clock className="size-4 text-amber" /> Estimated</p>
                  <p className="mt-1 font-heading text-base font-black text-white">{selected.estimated_minutes} min</p>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => setMobileDetailsOpen(false)}>Close</Button>
              <Button variant="danger" onClick={() => deleteRoute(selected)} disabled={deletingRouteId === selected.id}>
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button onClick={() => {
                setMobileDetailsOpen(false);
                setMobileLogSignal((signal) => (signal ?? 0) + 1);
              }}>Log Ride</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );

  async function deleteRoute(route: SavedRoute) {
    const confirmed = window.confirm(`Delete "${route.route_name}"? This also removes commute logs linked to this route.`);

    if (!confirmed) return;

    setDeletingRouteId(route.id);
    setError(null);

    try {
      await apiFetch<{ ok: boolean }>(`/api/routes/${route.id}`, { method: "DELETE" });
      const nextRoutes = routes.filter((item) => item.id !== route.id);
      setRoutes(nextRoutes);
      setSelected((current) => (current?.id === route.id ? (nextRoutes[0] ?? null) : current));
      setMobileDetailsOpen(false);
      setDesktopDetailsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete route");
    } finally {
      setDeletingRouteId(null);
    }
  }

  async function toggleFavorite(route: SavedRoute) {
    const nextFavorite = !route.is_favorite;
    setError(null);
    setRoutes((items) => items.map((item) => item.id === route.id ? { ...item, is_favorite: nextFavorite } : item));
    setSelected((current) => current?.id === route.id ? { ...current, is_favorite: nextFavorite } : current);

    try {
      await apiFetch<{ route: SavedRoute }>(`/api/routes/${route.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_favorite: nextFavorite })
      });
    } catch (err) {
      setRoutes((items) => items.map((item) => item.id === route.id ? { ...item, is_favorite: route.is_favorite } : item));
      setSelected((current) => current?.id === route.id ? { ...current, is_favorite: route.is_favorite } : current);
      setError(err instanceof Error ? err.message : "Unable to update favorite");
    }
  }

  const desktop = (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form className="w-full sm:w-80" onSubmit={(event) => {
            event.preventDefault();
            loadRoutes(query);
          }}>
            <SearchInput className="h-11 w-full" value={query} onChange={setQuery} submitLabel="Search routes" />
          </form>
          <div className="flex gap-2">
            <div className="relative">
              <Button variant="secondary" onClick={() => setFilterOpen((open) => !open)} aria-expanded={filterOpen} aria-haspopup="menu">
                <Filter className="size-4" />
                {routeFilter === "All" ? "Filter" : routeFilter}
              </Button>
              {filterOpen ? (
                <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-white/[0.08] bg-[#11161f] p-2 shadow-panel" role="menu">
                  {routeFilterOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-white/58 transition hover:bg-white/[0.06] hover:text-white",
                        routeFilter === option && "bg-[var(--blue-soft)] text-white"
                      )}
                      onClick={() => {
                        setRouteFilter(option);
                        setFilterOpen(false);
                      }}
                      role="menuitemradio"
                      aria-checked={routeFilter === option}
                    >
                      <span>{option}</span>
                      {routeFilter === option ? <span className="size-2 rounded-full bg-blue" /> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <AddRouteForm onSaved={() => loadRoutes()} />
          </div>
        </div>
        {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {loading ? <p className="text-sm text-white/45">Loading routes...</p> : visibleRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              active={selected?.id === route.id}
              onSelect={(item) => {
                setFilterOpen(false);
                setSelected(item);
                setDesktopDetailsOpen(true);
              }}
              onLog={(item) => {
                setFilterOpen(false);
                setSelected(item);
                setDesktopLogSignal((signal) => (signal ?? 0) + 1);
              }}
              onToggleFavorite={toggleFavorite}
              onDelete={deleteRoute}
              deleting={deletingRouteId === route.id}
            />
          ))}
          {!loading && !visibleRoutes.length ? <p className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4 text-sm text-white/48">No routes match this filter.</p> : null}
        </div>
        <RouteLogForm
          routes={routes}
          selectedRouteId={selected?.id}
          openSignal={desktopLogSignal}
          hideTrigger
          onSaved={() => loadRoutes()}
        />
      </section>
      <aside className="h-fit rounded-[24px] border border-white/[0.065] bg-surface p-5">
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Selected route</p>
                <h2 className="mt-2 font-heading text-2xl font-black">{selected.route_name}</h2>
              </div>
              <StatusBadge status={selected.is_favorite ? "Good" : "Moderate"} />
            </div>
            <div className="mt-5 space-y-3 text-sm text-white/65">
              <div className="rounded-2xl bg-white/[0.035] p-3">
                <span className="block text-xs text-white/38">Origin</span>
                <b className="mt-1 block leading-5 text-white">{selected.origin_name}</b>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-3">
                <span className="block text-xs text-white/38">Destination</span>
                <b className="mt-1 block leading-5 text-white">{selected.destination_name}</b>
              </div>
              <div className="flex justify-between gap-4 rounded-2xl bg-white/[0.035] p-3"><span>Preferred modes</span><b className="text-white">{formatModes(selected.preferred_modes, selected.preferred_mode)}</b></div>
              <div className="flex justify-between gap-4 rounded-2xl bg-white/[0.035] p-3"><span>Estimated</span><b className="text-white">{selected.estimated_minutes} min</b></div>
            </div>
            <div className="mt-5 space-y-3">
              <RouteLogForm buttonLabel="Log this route" routes={routes} selectedRouteId={selected.id} />
              <Button variant="danger" className="w-full" onClick={() => deleteRoute(selected)} disabled={deletingRouteId === selected.id}>
                <Trash2 className="size-4" />
                Delete route
              </Button>
            </div>
          </>
        ) : <p className="text-sm text-white/45">Select or add a route to see details.</p>}
      </aside>
      {selected && desktopDetailsOpen ? (
        <div className="fixed inset-0 z-[70] hidden items-center justify-center bg-bg/75 p-6 backdrop-blur-md lg:flex">
          <section className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/[0.08] bg-surface p-6 shadow-panel">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Route details</p>
                <h2 className="mt-1 truncate font-heading text-3xl font-black">{selected.route_name}</h2>
              </div>
              <button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setDesktopDetailsOpen(false)} aria-label="Close route details">
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-4">
              <StatusBadge status={selected.is_favorite ? "Good" : "Moderate"} />
            </div>
            <div className="mt-5 grid gap-3 text-sm text-white/62 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.035] p-4 sm:col-span-2">
                <span className="flex items-center gap-2 text-xs text-white/35"><MapPin className="size-4 text-blue" /> Origin</span>
                <p className="mt-2 leading-6 text-white/82">{selected.origin_name}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-4 sm:col-span-2">
                <span className="flex items-center gap-2 text-xs text-white/35"><MapPin className="size-4 text-teal" /> Destination</span>
                <p className="mt-2 leading-6 text-white/82">{selected.destination_name}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="text-xs text-white/35">Mode</p>
                <p className="mt-1 font-heading text-lg font-black text-white">{formatModes(selected.preferred_modes, selected.preferred_mode)}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.035] p-4">
                <p className="flex items-center gap-2 text-xs text-white/35"><Clock className="size-4 text-amber" /> Estimated</p>
                <p className="mt-1 font-heading text-lg font-black text-white">{selected.estimated_minutes} min</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Button variant="secondary" onClick={() => setDesktopDetailsOpen(false)}>Close</Button>
              <Button variant="danger" onClick={() => deleteRoute(selected)} disabled={deletingRouteId === selected.id}>
                <Trash2 className="size-4" />
                Delete
              </Button>
              <Button onClick={() => {
                setDesktopDetailsOpen(false);
                setDesktopLogSignal((signal) => (signal ?? 0) + 1);
              }}>Log Ride</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );

  return (
    <ResponsiveShell title="Routes" subtitle="Manage saved commutes and route details." mobile={mobile}>
      {desktop}
    </ResponsiveShell>
  );
}
