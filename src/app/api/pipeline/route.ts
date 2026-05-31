import { NextResponse } from "next/server";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";
import type { PipelineStatus, SavedRoute } from "@/lib/types";

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const { data, error } = await supabase
    .from("ll_pipeline_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("executed_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const logs = data ?? [];
  const summary = {
    latestRefresh: logs[0]?.executed_at ?? null,
    successfulSources: logs.filter((log) => log.status === "Success").length,
    partialSources: logs.filter((log) => log.status === "Partial").length,
    failedSources: logs.filter((log) => log.status === "Failed").length,
    totalRowsInsertedToday: logs.reduce((sum, log) => sum + Number(log.rows_inserted ?? 0), 0)
  };

  return NextResponse.json({ logs, summary });
}

export async function POST(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const { data: routes, error: routeError } = await supabase
    .from("ll_saved_routes")
    .select("*")
    .eq("session_id", sessionId)
    .order("is_favorite", { ascending: false })
    .limit(1);

  if (routeError) return NextResponse.json({ error: routeError.message }, { status: 500 });

  const route = routes?.[0] as SavedRoute | undefined;
  if (!route || !route.origin_lat || !route.origin_lng || !route.destination_lat || !route.destination_lng) {
    await insertPipelineLog(supabase, sessionId, "manual_refresh_test", "Failed", 0, "No route with complete coordinates found");
    return NextResponse.json({ error: "No route with complete coordinates found" }, { status: 400 });
  }

  const results = await Promise.allSettled([
    refreshWeather(supabase, sessionId, route),
    refreshAirQuality(supabase, sessionId, route),
    refreshOsrmRoute(supabase, sessionId, route)
  ]);

  const failed = results.filter((result) => result.status === "rejected").length;
  const status: PipelineStatus = failed === 0 ? "Success" : failed === results.length ? "Failed" : "Partial";

  await insertPipelineLog(supabase, sessionId, "manual_refresh_test", status, results.length - failed, failed ? `${failed} source(s) failed` : null);

  return NextResponse.json({ status, refreshed: results.length - failed, failed });
}

async function refreshWeather(supabase: ReturnType<typeof getSupabaseDataClient>, sessionId: string, route: SavedRoute) {
  const baseUrl = process.env.OPEN_METEO_FORECAST_URL ?? "https://api.open-meteo.com/v1/forecast";
  const url = `${baseUrl}?latitude=${route.destination_lat}&longitude=${route.destination_lng}&daily=temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=1`;
  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) throw new Error("Weather API failed");
  const json = await response.json();
  const rain = Number(json.daily?.precipitation_probability_max?.[0] ?? 0);
  const temperature = Number(json.daily?.temperature_2m_max?.[0] ?? 0);

  await supabase.from("ll_raw_api_responses").insert({ session_id: sessionId, source: "open_meteo_weather", route_id: route.id, request_url: url, response: json });
  await supabase.from("ll_weather_daily").upsert({
    session_id: sessionId,
    route_id: route.id,
    forecast_date: new Date().toISOString().slice(0, 10),
    rain_chance: rain,
    temperature_c: temperature,
    observed_at: new Date().toISOString()
  }, { onConflict: "session_id,route_id,forecast_date" });
  await insertPipelineLog(supabase, sessionId, "open_meteo_weather", "Success", 1, null);
}

async function refreshAirQuality(supabase: ReturnType<typeof getSupabaseDataClient>, sessionId: string, route: SavedRoute) {
  const baseUrl = process.env.OPEN_METEO_AIR_QUALITY_URL ?? "https://air-quality-api.open-meteo.com/v1/air-quality";
  const url = `${baseUrl}?latitude=${route.destination_lat}&longitude=${route.destination_lng}&hourly=us_aqi&timezone=auto&forecast_days=1`;
  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) throw new Error("Air quality API failed");
  const json = await response.json();
  const values = (json.hourly?.us_aqi ?? []).filter((value: unknown) => typeof value === "number") as number[];
  const aqi = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const label = aqi < 51 ? "Good" : aqi < 101 ? "Moderate" : "Poor";

  await supabase.from("ll_raw_api_responses").insert({ session_id: sessionId, source: "open_meteo_air_quality", route_id: route.id, request_url: url, response: json });
  await supabase.from("ll_air_quality_daily").upsert({
    session_id: sessionId,
    route_id: route.id,
    forecast_date: new Date().toISOString().slice(0, 10),
    aqi,
    label,
    observed_at: new Date().toISOString()
  }, { onConflict: "session_id,route_id,forecast_date" });
  await insertPipelineLog(supabase, sessionId, "open_meteo_air_quality", "Success", 1, null);
}

async function refreshOsrmRoute(supabase: ReturnType<typeof getSupabaseDataClient>, sessionId: string, route: SavedRoute) {
  const baseUrl = process.env.OSRM_ROUTE_URL ?? "https://router.project-osrm.org/route/v1";
  const url = `${baseUrl}/driving/${route.origin_lng},${route.origin_lat};${route.destination_lng},${route.destination_lat}?overview=false`;
  const response = await fetch(url, { next: { revalidate: 1800 } });
  if (!response.ok) throw new Error("OSRM API failed");
  const json = await response.json();
  const firstRoute = json.routes?.[0];
  const distanceKm = Number(((firstRoute?.distance ?? route.distance_km * 1000) / 1000).toFixed(2));
  const estimatedMinutes = Math.max(1, Math.round((firstRoute?.duration ?? route.estimated_minutes * 60) / 60));

  await supabase.from("ll_raw_api_responses").insert({ session_id: sessionId, source: "osrm_route", route_id: route.id, request_url: url, response: json });
  await supabase.from("ll_route_snapshots").insert({
    session_id: sessionId,
    route_id: route.id,
    distance_km: distanceKm,
    estimated_minutes: estimatedMinutes,
    provider: "osrm",
    observed_at: new Date().toISOString()
  });
  await insertPipelineLog(supabase, sessionId, "osrm_route", "Success", 1, null);
}

async function insertPipelineLog(supabase: ReturnType<typeof getSupabaseDataClient>, sessionId: string, source: string, status: PipelineStatus, rowsInserted: number, errorMessage: string | null) {
  await supabase.from("ll_pipeline_logs").insert({
    session_id: sessionId,
    source,
    status,
    rows_inserted: rowsInserted,
    executed_at: new Date().toISOString(),
    error_message: errorMessage
  });
}
