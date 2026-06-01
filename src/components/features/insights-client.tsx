"use client";

import { useEffect, useState } from "react";
import { BarChart3, Clock, Route, Star, Users } from "lucide-react";
import { CrowdLevelChart } from "@/components/charts/crowd-level-chart";
import { CommuteDurationChart } from "@/components/charts/commute-duration-chart";
import { RouteUsageChart } from "@/components/charts/route-usage-chart";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { apiFetch } from "@/lib/api-client";
import type { InsightsData } from "@/lib/types";

export function InsightsClient() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<InsightsData>("/api/insights")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load insights"));
  }, []);

  const metrics = [
    { label: "Average commute time", value: `${data?.averageCommuteTime ?? 0}m`, sub: "From saved logs", tone: "blue" as const, icon: Clock },
    { label: "Most used route", value: data?.mostUsedRoute ?? "None", sub: "Top route", tone: "teal" as const, icon: Route },
    { label: "Average rating", value: String(data?.averageRating ?? 0), sub: "Rider score", tone: "amber" as const, icon: Star },
    { label: "Common crowd level", value: data?.mostCommonCrowdLevel ?? "None", sub: "Most frequent", tone: "blue" as const, icon: Users },
    { label: "Logs this month", value: String(data?.logsThisMonth ?? 0), sub: "Current month", tone: "teal" as const, icon: BarChart3 }
  ];

  const mobile = (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-white/38">Patterns from your logs</p>
        <h1 className="font-heading text-3xl font-black">Insights</h1>
      </header>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <div className="grid grid-cols-2 gap-2.5">
        {metrics.slice(0, 4).map((metric) => <MetricCard key={metric.label} {...metric} className="min-h-[172px]" />)}
      </div>
      <CommuteDurationChart data={data?.durationTrend} />
      <RouteUsageChart data={data?.routeUsage} />
      <CrowdLevelChart data={data?.crowdDistribution} />
    </div>
  );

  const desktop = (
    <div className="space-y-5">
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <CommuteDurationChart data={data?.durationTrend} />
        <RouteUsageChart data={data?.routeUsage} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <CrowdLevelChart data={data?.crowdDistribution} />
        <div className="rounded-[20px] border border-white/[0.065] bg-surface p-5">
          <h3 className="font-heading text-lg font-black">Recent logs</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06]">
            {(data?.recentLogs ?? []).map((log) => (
              <div key={log.id} className="grid grid-cols-[1fr_90px_80px] border-b border-white/[0.04] p-3 text-sm last:border-0">
                <span className="font-heading font-bold text-white">{log.ll_saved_routes?.route_name ?? "Route"}</span>
                <span className="text-white/45">{log.actual_duration_minutes}m</span>
                <span className="text-amber">{log.rating}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveShell title="Insights" subtitle="Trends across commute time, crowding, and experience." mobile={mobile}>
      {desktop}
    </ResponsiveShell>
  );
}
