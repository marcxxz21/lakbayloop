"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "@/components/charts/chart-frame";
import { commuteDurationSeries } from "@/lib/mock-data";

export function CommuteDurationChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ChartFrame title="Commute duration" subtitle="Average minutes across your recent logs">
      {mounted ? <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={commuteDurationSeries} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "#111419", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "white" }} />
          <Area type="monotone" dataKey="minutes" stroke="#5B8EF0" fill="rgba(91,142,240,0.18)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer> : <div className="h-full rounded-2xl bg-white/[0.035]" />}
    </ChartFrame>
  );
}
