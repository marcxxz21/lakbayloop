"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Clock, Star } from "lucide-react";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { SearchInput } from "@/components/ui-custom/search-input";
import { apiFetch } from "@/lib/api-client";
import { formatModes } from "@/lib/commute-calculations";
import type { RouteLog, SavedRoute } from "@/lib/types";

type LogsResponse = { logs: RouteLog[] };

export function RideLogsClient() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [logs, setLogs] = useState<RouteLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [routesResult, logsResult] = await Promise.all([
        apiFetch<{ routes: SavedRoute[] }>("/api/routes"),
        apiFetch<LogsResponse>("/api/logs")
      ]);
      setRoutes(routesResult.routes);
      setLogs(logsResult.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load ride logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;
    return logs.filter((log) => {
      const routeName = log.ll_saved_routes?.route_name ?? "";
      const modes = formatModes(log.preferred_modes ?? log.ll_saved_routes?.preferred_modes, log.ll_saved_routes?.preferred_mode);
      return [routeName, modes, log.travel_date, log.crowd_level, log.notes ?? ""].some((value) => value.toLowerCase().includes(needle));
    });
  }, [logs, query]);

  const averageMinutes = logs.length ? Math.round(logs.reduce((sum, log) => sum + log.actual_duration_minutes, 0) / logs.length) : 0;
  const averageRating = logs.length ? (logs.reduce((sum, log) => sum + log.rating, 0) / logs.length).toFixed(1) : "0.0";

  const content = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput className="h-11 w-full sm:w-80" value={query} onChange={setQuery} placeholder="Search logs" />
        <RouteLogForm buttonLabel="Log ride" routes={routes} onSaved={load} />
      </div>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Ride logs" value={String(logs.length)} sub="Total entries" tone="blue" icon={CalendarCheck} />
        <MetricCard label="Avg duration" value={`${averageMinutes}m`} sub="From saved logs" tone="teal" icon={Clock} />
        <MetricCard label="Avg rating" value={averageRating} sub="Experience score" tone="amber" icon={Star} />
      </div>
      <DarkCard className="overflow-hidden p-0">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="font-heading text-xl font-black">Recent Ride Logs</h2>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {loading ? <p className="p-5 text-sm text-white/45">Loading ride logs...</p> : null}
          {!loading && !filteredLogs.length ? <p className="p-5 text-sm text-white/45">No ride logs yet.</p> : null}
          {filteredLogs.map((log) => (
            <div key={log.id} className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_120px_120px_90px] md:items-center">
              <div>
                <p className="font-semibold text-white">{log.ll_saved_routes?.route_name ?? "Saved route"}</p>
                <p className="mt-1 text-white/38">{formatModes(log.preferred_modes ?? log.ll_saved_routes?.preferred_modes, log.ll_saved_routes?.preferred_mode)} · {log.notes || "No notes"}</p>
              </div>
              <p className="font-semibold text-white/62">{new Date(log.travel_date).toLocaleDateString()}</p>
              <p className="font-semibold text-white/62">{log.actual_duration_minutes} min</p>
              <p className="font-semibold text-amber">{log.rating}/5</p>
            </div>
          ))}
        </div>
      </DarkCard>
    </div>
  );

  const mobile = (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/38">Commute history</p>
          <h1 className="font-heading text-3xl font-black">Log Ride</h1>
        </div>
        <RouteLogForm buttonLabel="Log" routes={routes} onSaved={load} />
      </header>
      {content}
    </div>
  );

  return (
    <ResponsiveShell title="Log Ride" subtitle="Record real commute experiences and keep your route history useful." mobile={mobile}>
      {content}
    </ResponsiveShell>
  );
}
