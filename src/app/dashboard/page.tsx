import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommuteContextCard } from "@/components/commute/commute-context-card";
import { CommuteTipCard } from "@/components/commute/commute-tip-card";
import { RouteCard } from "@/components/commute/route-card";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { WeatherAirQualityChart } from "@/components/charts/weather-air-quality-chart";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { dashboardActions, insightMetrics, mobileMetrics, mockRoutes, mockUser, routeLogs } from "@/lib/mock-data";

function MobileDashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Avatar initials={mockUser.initials} />
        <div className="flex flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-surface-soft px-4 py-3 text-sm text-white/25 mx-3">
          <Search className="size-4" />
          Search route
        </div>
        <Link href="/insights" className="flex size-10 items-center justify-center rounded-[14px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
          <Bell className="size-5" />
        </Link>
      </header>
      <section>
        <p className="text-sm text-white/45">Good morning,</p>
        <h1 className="font-heading text-4xl font-black">{mockUser.name}</h1>
      </section>
      <CommuteContextCard />
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
        {mockRoutes.slice(0, 2).map((route) => <RouteCard key={route.id} route={route} compact />)}
      </section>
      <div className="grid grid-cols-3 gap-2">
        {mobileMetrics.map((metric) => <MetricCard key={metric.label} {...metric} className="p-4" />)}
      </div>
    </div>
  );
}

function DesktopDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-4">
        {insightMetrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <CommuteContextCard />
        <div className="grid gap-4">
          <CommuteTipCard />
          <div className="rounded-[20px] border border-white/[0.065] bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-black">Favorite routes</h3>
              <Link href="/routes" className="text-sm font-semibold text-blue">See all</Link>
            </div>
            <div className="space-y-3">
              {mockRoutes.slice(0, 2).map((route) => <RouteCard key={route.id} route={route} compact />)}
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <WeatherAirQualityChart />
        <div className="rounded-[20px] border border-white/[0.065] bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading text-lg font-black">Recent logs</h3>
            <RouteLogForm buttonLabel="Log ride" />
          </div>
          <div className="space-y-3">
            {routeLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-2xl bg-white/[0.035] p-3">
                <div>
                  <p className="font-heading text-sm font-bold">{log.route}</p>
                  <p className="mt-1 text-xs text-white/38">{log.date} · {log.crowd}</p>
                </div>
                <span className="font-heading text-lg font-black text-white">{log.duration}m</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ResponsiveShell title="Good morning, Josie" subtitle="Your commute dashboard is ready for today." mobile={<MobileDashboard />}>
      <DesktopDashboard />
    </ResponsiveShell>
  );
}
