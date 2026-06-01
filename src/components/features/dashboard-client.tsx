"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Bell, CloudRain } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { RouteCard } from "@/components/commute/route-card";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { WeatherAirQualityChart } from "@/components/charts/weather-air-quality-chart";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { SearchInput } from "@/components/ui-custom/search-input";
import { CommuteTipCard } from "@/components/commute/commute-tip-card";
import { apiFetch } from "@/lib/api-client";
import { formatModes } from "@/lib/commute-calculations";
import { dashboardActions } from "@/lib/mock-data";
import { getBrowserSessionId } from "@/lib/session";
import type { DashboardData } from "@/lib/types";
import { CalendarCheck, Database, Route, TrendingUp } from "lucide-react";

const dashboardCacheKeyPrefix = "kalakbay_dashboard_cache";

function getDashboardCacheKey() {
  return `${dashboardCacheKeyPrefix}:${getBrowserSessionId()}`;
}

function readCachedDashboard(): DashboardData | null {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem(getDashboardCacheKey());
  if (!cached) return null;

  try {
    return JSON.parse(cached) as DashboardData;
  } catch {
    window.localStorage.removeItem(getDashboardCacheKey());
    return null;
  }
}

function cacheDashboard(data: DashboardData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getDashboardCacheKey(), JSON.stringify(data));
}

function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good night";
}

export function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(() => readCachedDashboard());
  const [isLoading, setIsLoading] = useState(() => data === null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const greeting = getTimeGreeting();

  async function loadDashboard() {
    setIsLoading(true);
    try {
      const result = await apiFetch<DashboardData>("/api/dashboard");
      setData(result);
      cacheDashboard(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredRoutes = useMemo(() => {
    const routes = data?.routes ?? [];
    if (!search.trim()) return routes.slice(0, 4);
    const q = search.toLowerCase();
    return routes.filter((route) =>
      [route.route_name, route.origin_name, route.destination_name, formatModes(route.preferred_modes, route.preferred_mode)].some((value) => value.toLowerCase().includes(q))
    );
  }, [data?.routes, search]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = search.trim();
    router.push(trimmed ? `/routes?q=${encodeURIComponent(trimmed)}` : "/routes");
  }

  if (!data) {
    const loadingMobile = (
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <AppLogoMark className="size-11 rounded-[16px]" />
          <form className="mx-3 min-w-0 flex-1" onSubmit={submitSearch}>
            <SearchInput className="h-12 w-full" value={search} onChange={setSearch} submitLabel="Search routes" />
          </form>
          <Link href="/insights" className="flex size-10 items-center justify-center rounded-[14px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
            <Bell className="size-5" />
          </Link>
        </header>
        <section>
          <p className="text-sm text-white/45">{greeting},</p>
          <h1 className="font-heading text-3xl font-black">Loading your profile</h1>
        </section>
        {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
        <div className="glass-panel rounded-[24px] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/38">Today&apos;s commute</p>
          <p className="mt-3 font-heading text-2xl font-black text-white">Syncing Kalakbay</p>
          <p className="mt-2 text-sm leading-6 text-white/55">Loading your saved routes, logs, and commute context.</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-white/[0.045]" />)}
          </div>
        </div>
      </div>
    );

    const loadingDesktop = (
      <div className="grid min-w-0 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-[182px] animate-pulse rounded-[20px] border border-white/[0.065] bg-surface" />)}
      </div>
    );

    return (
      <ResponsiveShell title={`${greeting}`} subtitle={isLoading ? "Loading your Kalakbay commute profile." : "Your commute profile could not be loaded yet."} mobile={loadingMobile}>
        {loadingDesktop}
      </ResponsiveShell>
    );
  }

  const context = (
    <div className="glass-panel relative min-w-0 overflow-hidden rounded-[24px] p-5">
      <div className="absolute -right-10 -top-12 size-36 rounded-full bg-blue/10 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/38">Today&apos;s commute</p>
          <h2 className="mt-2 font-heading text-2xl font-black text-white">{data.today.route?.route_name ?? "Add a route to begin"}</h2>
          <p className="mt-1 text-sm text-white/55">
            {data.today.route ? `${formatModes(data.today.route.preferred_modes, data.today.route.preferred_mode)} · ${data.today.route.distance_km} km` : "Routes you add will appear here."}
          </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--amber-border)] bg-[var(--amber-soft)] text-amber">
          <CloudRain className="size-6" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-[11px] text-white/35">Estimated</p>
          <p className="mt-1 font-heading text-lg font-black">{data.today.route?.estimated_minutes ?? 0} min</p>
        </div>
        <div className="rounded-2xl bg-[var(--amber-soft)] p-3">
          <p className="text-[11px] text-white/35">Rain</p>
          <p className="mt-1 font-heading text-lg font-black text-amber">{data.today.rainChance}%</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-[11px] text-white/35">AQI</p>
          <p className="mt-1 font-heading text-lg font-black">{data.today.airQuality}</p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl border border-[var(--blue-border)] bg-[var(--blue-soft)] p-3 text-sm leading-6 text-white/72">{data.today.tip}</p>
      <div className="mt-4">
        <RouteLogForm buttonLabel="Log ride" routes={data.routes} onSaved={loadDashboard} />
      </div>
    </div>
  );

  const userName = data.user.full_name.trim().split(/\s+/)[0] || "there";
  const initials = data.user.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "K";

  const metrics = [
    { label: "Saved Routes", value: String(data.metrics.savedRoutes), sub: "Live from database", tone: "blue" as const, icon: Route },
    { label: "Logs This Month", value: String(data.metrics.logsThisMonth), sub: "Route logs", tone: "teal" as const, icon: CalendarCheck },
    { label: "Avg Commute", value: `${data.metrics.avgCommute}m`, sub: "Across recent logs", tone: "amber" as const, icon: TrendingUp },
    { label: "Pipeline Status", value: data.metrics.pipelineStatus, sub: "Latest run", tone: data.metrics.pipelineStatus === "Failed" ? "red" as const : data.metrics.pipelineStatus === "Partial" ? "amber" as const : "teal" as const, icon: Database }
  ];

  const mobile = (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Avatar initials={initials} />
        <form className="mx-3 min-w-0 flex-1" onSubmit={submitSearch}>
          <SearchInput className="h-12 w-full" value={search} onChange={setSearch} submitLabel="Search routes" />
        </form>
        <Link href="/insights" className="flex size-10 items-center justify-center rounded-[14px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
          <Bell className="size-5" />
        </Link>
      </header>
      <section>
        <p className="text-sm text-white/45">{greeting},</p>
        <h1 className="font-heading text-3xl font-black">{userName}</h1>
      </section>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      {context}
      <div className="grid grid-cols-4 gap-3">
        {dashboardActions.map((action) => (
          <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2">
            <span className="flex size-14 items-center justify-center rounded-[18px] border border-white/[0.09] bg-white/[0.06]">
              <action.icon className="size-5 text-white/70" />
            </span>
            <span className="text-[11px] text-white/42">{action.label}</span>
          </Link>
        ))}
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-black">Saved routes</h2>
          <Link href="/routes" className="text-sm font-semibold text-blue">See all</Link>
        </div>
        {filteredRoutes.map((route) => <RouteCard key={route.id} route={route} compact />)}
      </section>
    </div>
  );

  const desktop = (
    <div className="min-w-0 space-y-5">
      <div className="grid min-w-0 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        {context}
        <div className="grid min-w-0 gap-4">
          <CommuteTipCard />
          <div className="min-w-0 rounded-[20px] border border-white/[0.065] bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-black">Favorite routes</h3>
              <Link href="/routes" className="text-sm font-semibold text-blue">See all</Link>
            </div>
            <form className="mb-4" onSubmit={submitSearch}>
              <SearchInput className="h-10 w-full" value={search} onChange={setSearch} submitLabel="Search routes" />
            </form>
            <div className="space-y-3">
              {filteredRoutes.map((route) => <RouteCard key={route.id} route={route} compact />)}
            </div>
          </div>
        </div>
      </div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <WeatherAirQualityChart />
        <div className="min-w-0 rounded-[20px] border border-white/[0.065] bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-black">Recent logs</h3>
            <RouteLogForm buttonLabel="Log ride" routes={data.routes} onSaved={loadDashboard} />
          </div>
          <div className="space-y-3">
            {(data?.logs ?? []).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-2xl bg-white/[0.035] p-3">
                <div>
                  <p className="font-heading text-sm font-bold">{log.ll_saved_routes?.route_name ?? "Route"}</p>
                  <p className="mt-1 text-xs text-white/38">{log.travel_date} · {log.crowd_level}</p>
                </div>
                <span className="font-heading text-lg font-black text-white">{log.actual_duration_minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ResponsiveShell title={`${greeting}, ${userName}`} subtitle="Your commute dashboard is live from Supabase." mobile={mobile}>
      {desktop}
    </ResponsiveShell>
  );
}
