"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame } from "@/components/charts/chart-frame";
import { airQualitySeries, weatherSeries } from "@/lib/mock-data";

const data = weatherSeries.map((item, index) => ({
  day: item.day,
  rain: item.rain,
  aqi: airQualitySeries[index]?.aqi ?? 0
}));

export function WeatherAirQualityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ChartFrame title="Weather and air quality" subtitle="Rain chance and AQI along saved routes">
      {mounted ? <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "#111419", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "white" }} />
          <Line type="monotone" dataKey="rain" stroke="#E8A84C" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="aqi" stroke="#5B8EF0" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer> : <div className="h-full rounded-2xl bg-white/[0.035]" />}
    </ChartFrame>
  );
}
