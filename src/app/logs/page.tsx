import { ArrowRight, Database, Layers3 } from "lucide-react";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { PipelineCard } from "@/components/pipeline/pipeline-card";
import { PipelineSummary } from "@/components/pipeline/pipeline-summary";
import { PipelineTable } from "@/components/pipeline/pipeline-table";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { pipelineLogs } from "@/lib/mock-data";

function MobileLogs() {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/38">Ride logs and pipeline</p>
          <h1 className="font-heading text-4xl font-black">Log</h1>
        </div>
        <RouteLogForm buttonLabel="Log ride" />
      </header>
      <MetricCard label="Rows inserted today" value="847" sub="Across 4 sources" tone="teal" icon={Database} />
      <div className="space-y-3">
        {pipelineLogs.map((log) => <PipelineCard key={log.source} log={log} />)}
      </div>
    </div>
  );
}

function DesktopLogs() {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <RouteLogForm buttonLabel="Log ride" />
      </div>
      <PipelineSummary />
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <PipelineTable />
        <DarkCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[15px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
              <Layers3 className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-black">Extract -&gt; Transform -&gt; Load</h2>
              <p className="text-xs text-white/38">Backend-ready data engineering flow</p>
            </div>
          </div>
          <p className="mt-5 leading-7 text-white/62">
            Raw API responses are stored before transformation. Clean rows are upserted into analytics-ready tables. Each run writes an observability log.
          </p>
          <div className="mt-6 space-y-3 text-sm font-semibold text-white/62">
            {["Free public APIs", "Vercel Cron Job", "Next.js API Route", "Raw API Response Storage", "Transform Layer", "Clean Supabase Tables", "Dashboard Analytics"].map((step, index, list) => (
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
}

export default function LogsPage() {
  return (
    <ResponsiveShell title="Pipeline Logs" subtitle="Monitor commute data freshness and observability." mobile={<MobileLogs />}>
      <DesktopLogs />
    </ResponsiveShell>
  );
}
