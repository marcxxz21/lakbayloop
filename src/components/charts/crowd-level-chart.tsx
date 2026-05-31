"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartFrame } from "@/components/charts/chart-frame";
import { crowdLevelSeries } from "@/lib/mock-data";

const colors = ["#3EC9A7", "#5B8EF0", "#E8A84C", "#E05C5C"];

export function CrowdLevelChart({ data = crowdLevelSeries }: { data?: { level: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ChartFrame title="Crowd level" subtitle="Distribution from ride logs">
      {mounted ? <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={{ background: "#111419", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "white" }} />
          <Pie data={data} dataKey="value" nameKey="level" innerRadius={58} outerRadius={92} paddingAngle={4}>
            {data.map((entry, index) => <Cell key={entry.level} fill={colors[index % colors.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer> : <div className="h-full rounded-2xl bg-white/[0.035]" />}
    </ChartFrame>
  );
}
