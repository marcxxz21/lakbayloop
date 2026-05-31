import { StatusBadge } from "@/components/ui-custom/status-badge";
import type { PipelineLog } from "@/lib/types";

export function PipelineTable({ logs }: { logs: PipelineLog[] }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-white/[0.065] bg-surface">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/[0.055] text-left text-[11px] font-bold uppercase tracking-[0.08em] text-white/30">
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Rows Inserted</th>
            <th className="px-4 py-3">Executed At</th>
            <th className="px-4 py-3">Error Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025]">
              <td className="px-4 py-4 font-heading text-sm font-bold text-white">{log.source}</td>
              <td className="px-4 py-4"><StatusBadge status={log.status} /></td>
              <td className="px-4 py-4 text-sm text-white/65">{log.rows_inserted}</td>
              <td className="px-4 py-4 text-sm text-white/65">{new Date(log.executed_at).toLocaleString()}</td>
              <td className="px-4 py-4 text-sm text-white/55">{log.error_message ?? "None"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
