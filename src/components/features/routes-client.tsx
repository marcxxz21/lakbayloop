"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, Filter, MapPin, X } from "lucide-react";
import { AddRouteForm } from "@/components/commute/add-route-form";
import { RouteCard } from "@/components/commute/route-card";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui-custom/search-input";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { apiFetch } from "@/lib/api-client";
import type { SavedRoute } from "@/lib/types";

export function RoutesPageClient() {
  const searchParams = useSearchParams();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<SavedRoute | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [mobileLogSignal, setMobileLogSignal] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <AddRouteForm onSaved={() => loadRoutes()} />
      </header>
      <form onSubmit={(event) => {
        event.preventDefault();
        loadRoutes(query);
      }}>
        <SearchInput className="h-12 w-full" value={query} onChange={setQuery} submitLabel="Search routes" />
      </form>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <div className="space-y-3">
        {loading ? <p className="text-sm text-white/45">Loading routes...</p> : routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            onSelect={(item) => {
              setSelected(item);
              setMobileDetailsOpen(true);
            }}
            onLog={(item) => {
              setSelected(item);
              setMobileLogSignal((signal) => (signal ?? 0) + 1);
            }}
            onToggleFavorite={toggleFavorite}
          />
        ))}
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
                  <p className="mt-1 font-heading text-base font-black text-white">{selected.preferred_mode}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.035] p-3">
                  <p className="flex items-center gap-2 text-xs text-white/35"><Clock className="size-4 text-amber" /> Estimated</p>
                  <p className="mt-1 font-heading text-base font-black text-white">{selected.estimated_minutes} min</p>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setMobileDetailsOpen(false)}>Close</Button>
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

  async function toggleFavorite(route: SavedRoute) {
    await apiFetch<{ route: SavedRoute }>(`/api/routes/${route.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_favorite: !route.is_favorite })
    });
    await loadRoutes();
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
            <Button variant="secondary">
              <Filter className="size-4" />
              Filter
            </Button>
            <AddRouteForm onSaved={() => loadRoutes()} />
          </div>
        </div>
        {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
        <div className="grid gap-4 xl:grid-cols-2">
          {loading ? <p className="text-sm text-white/45">Loading routes...</p> : routes.map((route) => (
            <RouteCard key={route.id} route={route} onSelect={setSelected} onLog={setSelected} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
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
              <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Origin</span><b className="text-white">{selected.origin_name}</b></div>
              <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Destination</span><b className="text-white">{selected.destination_name}</b></div>
              <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Preferred mode</span><b className="text-white">{selected.preferred_mode}</b></div>
              <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Estimated</span><b className="text-white">{selected.estimated_minutes} min</b></div>
            </div>
            <div className="mt-5">
              <RouteLogForm buttonLabel="Log this route" routes={routes} selectedRouteId={selected.id} />
            </div>
          </>
        ) : <p className="text-sm text-white/45">Select or add a route to see details.</p>}
      </aside>
    </div>
  );

  return (
    <ResponsiveShell title="Routes" subtitle="Manage saved commutes and route details." mobile={mobile}>
      {desktop}
    </ResponsiveShell>
  );
}
