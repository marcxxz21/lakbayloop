import { Database, RefreshCcw, TriangleAlert, XCircle } from "lucide-react";
import { MetricCard } from "@/components/ui-custom/metric-card";

export function PipelineSummary({
  summary
}: {
  summary?: {
    latestRefresh: string | null;
    successfulSources: number;
    partialSources: number;
    failedSources: number;
    totalRowsInsertedToday: number;
  };
}) {
  const latest = summary?.latestRefresh ? new Date(summary.latestRefresh).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "Never";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Latest refresh" value={latest} sub={`${summary?.totalRowsInsertedToday ?? 0} rows today`} tone="blue" icon={RefreshCcw} />
      <MetricCard label="Successful sources" value={String(summary?.successfulSources ?? 0)} sub="Completed runs" tone="teal" icon={Database} />
      <MetricCard label="Partial sources" value={String(summary?.partialSources ?? 0)} sub="Needs review" tone="amber" icon={TriangleAlert} />
      <MetricCard label="Failed sources" value={String(summary?.failedSources ?? 0)} sub="Errors" tone="red" icon={XCircle} />
    </div>
  );
}
