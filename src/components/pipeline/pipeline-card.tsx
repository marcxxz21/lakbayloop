import { Database } from "lucide-react";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";

export function PipelineCard({ log }: { log: { source: string; status: string; rows: number; executedAt: string; error: string } }) {
  return (
    <DarkCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04]">
            <Database className="size-5 text-blue" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-black text-white">{log.source}</h3>
            <p className="mt-1 text-xs text-white/35">{log.executedAt}</p>
          </div>
        </div>
        <StatusBadge status={log.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-white/[0.035] p-3">
          <p className="text-xs text-white/35">Rows inserted</p>
          <p className="mt-1 font-heading text-xl font-black">{log.rows}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.035] p-3">
          <p className="text-xs text-white/35">Error</p>
          <p className="mt-1 truncate text-white/65">{log.error}</p>
        </div>
      </div>
    </DarkCard>
  );
}
