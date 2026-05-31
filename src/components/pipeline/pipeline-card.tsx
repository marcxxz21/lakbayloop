import { Database } from "lucide-react";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import type { PipelineLog } from "@/lib/types";

export function PipelineCard({ log }: { log: PipelineLog }) {
  return (
    <DarkCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04]">
            <Database className="size-5 text-blue" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-black text-white">{log.source}</h3>
            <p className="mt-1 text-xs text-white/35">{new Date(log.executed_at).toLocaleString()}</p>
          </div>
        </div>
        <StatusBadge status={log.status} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-white/[0.035] p-3">
          <p className="text-xs text-white/35">Rows inserted</p>
          <p className="mt-1 font-heading text-xl font-black">{log.rows_inserted}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.035] p-3">
          <p className="text-xs text-white/35">Error</p>
          <p className="mt-1 truncate text-white/65">{log.error_message ?? "None"}</p>
        </div>
      </div>
    </DarkCard>
  );
}
