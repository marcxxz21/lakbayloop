import { CrowdLevelChart } from "@/components/charts/crowd-level-chart";
import { CommuteDurationChart } from "@/components/charts/commute-duration-chart";
import { RouteUsageChart } from "@/components/charts/route-usage-chart";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { routeLogs } from "@/lib/mock-data";
import { BarChart3, Clock, Route, Star, Users } from "lucide-react";

const metrics = [
  { label: "Average commute time", value: "34m", sub: "This month", tone: "blue" as const, icon: Clock },
  { label: "Most used route", value: "UP", sub: "9 logs", tone: "teal" as const, icon: Route },
  { label: "Average rating", value: "4.2", sub: "Good experience", tone: "amber" as const, icon: Star },
  { label: "Common crowd level", value: "Mod", sub: "48% of logs", tone: "blue" as const, icon: Users },
  { label: "Logs this month", value: "18", sub: "+5 vs April", tone: "teal" as const, icon: BarChart3 }
];

function MobileInsights() {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-white/38">Patterns from your logs</p>
        <h1 className="font-heading text-4xl font-black">Insights</h1>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {metrics.slice(0, 4).map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <CommuteDurationChart />
      <RouteUsageChart />
      <CrowdLevelChart />
    </div>
  );
}

function DesktopInsights() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <CommuteDurationChart />
        <RouteUsageChart />
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <CrowdLevelChart />
        <div className="rounded-[20px] border border-white/[0.065] bg-surface p-5">
          <h3 className="font-heading text-lg font-black">Recent logs</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06]">
            {routeLogs.map((log) => (
              <div key={log.id} className="grid grid-cols-[1fr_90px_80px] border-b border-white/[0.04] p-3 text-sm last:border-0">
                <span className="font-heading font-bold text-white">{log.route}</span>
                <span className="text-white/45">{log.duration}m</span>
                <span className="text-amber">{log.rating}/5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <ResponsiveShell title="Insights" subtitle="Trends across commute time, crowding, and experience." mobile={<MobileInsights />}>
      <DesktopInsights />
    </ResponsiveShell>
  );
}
