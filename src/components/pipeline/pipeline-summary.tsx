import { Database, RefreshCcw, TriangleAlert, XCircle } from "lucide-react";
import { MetricCard } from "@/components/ui-custom/metric-card";

export function PipelineSummary() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Latest refresh" value="6:05" sub="Today AM" tone="blue" icon={RefreshCcw} />
      <MetricCard label="Successful sources" value="2" sub="Weather + AQI" tone="teal" icon={Database} />
      <MetricCard label="Partial sources" value="1" sub="OSRM route" tone="amber" icon={TriangleAlert} />
      <MetricCard label="Failed sources" value="1" sub="Manual test" tone="red" icon={XCircle} />
    </div>
  );
}
