import { NextResponse } from "next/server";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";
import type { DashboardData, PipelineStatus, RouteLog, SavedRoute } from "@/lib/types";

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const [userResult, routesResult, logsResult, pipelineResult, weatherResult, airResult] = await Promise.all([
    supabase.from("ll_app_users").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("ll_saved_routes").select("*").eq("session_id", sessionId).order("is_favorite", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("ll_route_logs").select("*, ll_saved_routes(route_name, preferred_mode, preferred_modes)").eq("session_id", sessionId).order("travel_date", { ascending: false }).limit(8),
    supabase.from("ll_pipeline_logs").select("*").eq("session_id", sessionId).order("executed_at", { ascending: false }).limit(1),
    supabase.from("ll_weather_daily").select("*").eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(1),
    supabase.from("ll_air_quality_daily").select("*").eq("session_id", sessionId).order("observed_at", { ascending: false }).limit(1)
  ]);

  const firstError = [userResult.error, routesResult.error, logsResult.error, pipelineResult.error, weatherResult.error, airResult.error].find(Boolean);
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const routes = (routesResult.data ?? []) as SavedRoute[];
  const logs = (logsResult.data ?? []) as RouteLog[];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const logsThisMonth = logs.filter((log) => log.travel_date.startsWith(currentMonth)).length;
  const avgCommute = logs.length ? Math.round(logs.reduce((sum, log) => sum + log.actual_duration_minutes, 0) / logs.length) : 0;
  const pipelineStatus = ((pipelineResult.data?.[0]?.status as PipelineStatus | undefined) ?? "Success");
  const route = routes.find((item) => item.is_favorite) ?? routes[0] ?? null;
  const rainChance = Number(weatherResult.data?.[0]?.rain_chance ?? 40);
  const airQuality = airResult.data?.[0]?.label ?? "Moderate";

  const data: DashboardData = {
    user: userResult.data ?? {
      id: "demo",
      session_id: sessionId,
      full_name: "Josie Dela Cruz",
      email: null,
      school_or_workplace: "Daily commute",
      preferred_mode: "Mixed",
      preferred_modes: ["Mixed"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    routes,
    favoriteRoutes: routes.filter((item) => item.is_favorite),
    logs,
    metrics: {
      savedRoutes: routes.length,
      logsThisMonth,
      avgCommute,
      pipelineStatus
    },
    today: {
      route,
      rainChance,
      airQuality,
      tip: rainChance >= 35
        ? "Bring an umbrella. Rain is expected later along your route."
        : "Conditions look steady. Your usual route should be a good pick today."
    }
  };

  return NextResponse.json(data);
}
