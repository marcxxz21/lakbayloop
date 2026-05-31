import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDistanceKm, estimateMinutes } from "@/lib/commute-calculations";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";
import type { PreferredMode } from "@/lib/types";

const routeSchema = z.object({
  route_name: z.string().min(2),
  origin_name: z.string().min(1),
  origin_lat: z.coerce.number().optional().nullable(),
  origin_lng: z.coerce.number().optional().nullable(),
  destination_name: z.string().min(1),
  destination_lat: z.coerce.number().optional().nullable(),
  destination_lng: z.coerce.number().optional().nullable(),
  preferred_mode: z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"]),
  is_favorite: z.boolean().default(false)
});

export async function GET(request: Request) {
  const sessionId = getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  let query = supabase
    .from("ll_saved_routes")
    .select("*")
    .eq("session_id", sessionId)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`route_name.ilike.%${q}%,origin_name.ilike.%${q}%,destination_name.ilike.%${q}%,preferred_mode.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ routes: data ?? [] });
}

export async function POST(request: Request) {
  const sessionId = getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const body = routeSchema.parse(await request.json());
  const distanceKm = calculateDistanceKm(body.origin_lat, body.origin_lng, body.destination_lat, body.destination_lng);
  const estimated = estimateMinutes(distanceKm, body.preferred_mode as PreferredMode);

  const { data, error } = await supabase
    .from("ll_saved_routes")
    .insert({
      ...body,
      session_id: sessionId,
      distance_km: distanceKm,
      estimated_minutes: estimated
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ route: data }, { status: 201 });
}
