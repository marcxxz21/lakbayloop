"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Database, Layers3, RefreshCcw } from "lucide-react";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { PipelineCard } from "@/components/pipeline/pipeline-card";
import { PipelineSummary } from "@/components/pipeline/pipeline-summary";
import { PipelineTable } from "@/components/pipeline/pipeline-table";
import { Button } from "@/components/ui/button";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { apiFetch } from "@/lib/api-client";
import type { PipelineLog, SavedRoute } from "@/lib/types";

type PipelineResponse = {
  logs: PipelineLog[];
  summary: {
    latestRefresh: string | null;
    successfulSources: number;
    partialSources: number;
    failedSources: number;
    totalRowsInsertedToday: number;
  };
};

export function LogsClient() {
  const [pipeline, setPipeline] = useState<PipelineResponse | null>(null);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [pipelineResult, routesResult] = await Promise.all([
      apiFetch<PipelineResponse>("/api/pipeline"),
      apiFetch<{ routes: SavedRoute[] }>("/api/routes")
    ]);
    setPipeline(pipelineResult);
    setRoutes(routesResult.routes);
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load logs"));
  }, []);

  async function refreshPipeline() {
    setRefreshing(true);
    setError(null);
    try {
      await apiFetch("/api/pipeline", { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh pipeline");
      await load().catch(() => undefined);
    } finally {
      setRefreshing(false);
    }
  }

  const mobile = (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/38">Ride logs and pipeline</p>
          <h1 className="font-heading text-3xl font-black">Log</h1>
        </div>
        <RouteLogForm buttonLabel="Log ride" routes={routes} onSaved={load} />
      </header>
      <MetricCard label="Rows inserted today" value={String(pipeline?.summary.totalRowsInsertedToday ?? 0)} sub="Across data sources" tone="teal" icon={Database} />
      <Button variant="secondary" className="w-full" onClick={refreshPipeline} disabled={refreshing}>
        <RefreshCcw className="size-4" />
        {refreshing ? "Refreshing..." : "Refresh APIs"}
      </Button>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <div className="space-y-3">
        {(pipeline?.logs ?? []).map((log) => <PipelineCard key={log.id} log={log} />)}
      </div>
    </div>
  );

  const desktop = (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={refreshPipeline} disabled={refreshing}>
          <RefreshCcw className="size-4" />
          {refreshing ? "Refreshing APIs..." : "Refresh APIs"}
        </Button>
        <RouteLogForm buttonLabel="Log ride" routes={routes} onSaved={load} />
      </div>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <PipelineSummary summary={pipeline?.summary} />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <PipelineTable logs={pipeline?.logs ?? []} />
        <DarkCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[15px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
              <Layers3 className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-black">Extract -&gt; Transform -&gt; Load</h2>
              <p className="text-xs text-white/38">Live API refresh + Supabase observability</p>
            </div>
          </div>
          <p className="mt-5 leading-7 text-white/62">
            The refresh button calls Open-Meteo weather, Open-Meteo air quality, and OSRM routing APIs, stores raw responses, transforms clean rows, and writes pipeline logs.
          </p>
          <div className="mt-6 space-y-3 text-sm font-semibold text-white/62">
            {["Open-Meteo Weather", "Open-Meteo Air Quality", "OSRM Route", "Raw API Response Storage", "Transform Layer", "Clean Supabase Tables", "Dashboard Analytics"].map((step, index, list) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl bg-white/[0.035] p-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.06] text-xs">{index + 1}</span>
                <span>{step}</span>
                {index < list.length - 1 ? <ArrowRight className="ml-auto size-4 text-white/25" /> : null}
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </div>
  );

  return (
    <ResponsiveShell title="Pipeline Logs" subtitle="Monitor commute data freshness and observability." mobile={mobile}>
      {desktop}
    </ResponsiveShell>
  );
}
