"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "@/components/charts/chart-frame";
import { routeUsageSeries } from "@/lib/mock-data";

export function RouteUsageChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ChartFrame title="Route usage" subtitle="Most logged saved routes">
      {mounted ? <ResponsiveContainer width="100%" height="100%">
        <BarChart data={routeUsageSeries} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="route" tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "#111419", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "white" }} />
          <Bar dataKey="logs" fill="#3EC9A7" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer> : <div className="h-full rounded-2xl bg-white/[0.035]" />}
    </ChartFrame>
  );
}
