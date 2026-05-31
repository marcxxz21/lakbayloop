import { NextResponse } from "next/server";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";
import { formatDateLabel } from "@/lib/commute-calculations";
import type { InsightsData, RouteLog } from "@/lib/types";

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const { data, error } = await supabase
    .from("ll_route_logs")
    .select("*, ll_saved_routes(route_name, preferred_mode)")
    .eq("session_id", sessionId)
    .order("travel_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = (data ?? []) as RouteLog[];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const routeCounts = countBy(logs, (log) => log.ll_saved_routes?.route_name ?? "Unknown route");
  const crowdCounts = countBy(logs, (log) => log.crowd_level);
  const averageCommuteTime = logs.length ? Math.round(logs.reduce((sum, log) => sum + log.actual_duration_minutes, 0) / logs.length) : 0;
  const averageRating = logs.length ? Number((logs.reduce((sum, log) => sum + log.rating, 0) / logs.length).toFixed(1)) : 0;

  const byDay = new Map<string, { total: number; count: number }>();
  logs.forEach((log) => {
    const current = byDay.get(log.travel_date) ?? { total: 0, count: 0 };
    current.total += log.actual_duration_minutes;
    current.count += 1;
    byDay.set(log.travel_date, current);
  });

  const insights: InsightsData = {
    averageCommuteTime,
    mostUsedRoute: topEntry(routeCounts) ?? "No logs",
    averageRating,
    mostCommonCrowdLevel: topEntry(crowdCounts) ?? "No logs",
    logsThisMonth: logs.filter((log) => log.travel_date.startsWith(currentMonth)).length,
    durationTrend: [...byDay.entries()]
      .slice(0, 7)
      .reverse()
      .map(([day, value]) => ({ day: formatDateLabel(day), minutes: Math.round(value.total / value.count) })),
    routeUsage: [...routeCounts.entries()].map(([route, count]) => ({ route, logs: count })).slice(0, 6),
    crowdDistribution: [...crowdCounts.entries()].map(([level, count]) => ({ level, value: count })),
    recentLogs: logs.slice(0, 8)
  };

  return NextResponse.json(insights);
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
}

function topEntry(map: Map<string, number>) {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
