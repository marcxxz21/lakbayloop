import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDistanceKm, estimateMinutesForModes, primaryMode } from "@/lib/commute-calculations";
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
  preferred_mode: z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"]).optional(),
  preferred_modes: z.array(z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"])).min(1).optional(),
  is_favorite: z.boolean().default(false)
});

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
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
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const body = routeSchema.parse(await request.json());

  const origin = await resolveCoordinates(body.origin_name, body.origin_lat, body.origin_lng);
  const destination = await resolveCoordinates(body.destination_name, body.destination_lat, body.destination_lng);

  if (!origin || !destination) {
    return NextResponse.json({ error: "Choose a specific start point and end point from address search." }, { status: 422 });
  }

  const distanceKm = calculateDistanceKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
  const modes = (body.preferred_modes?.length ? body.preferred_modes : [body.preferred_mode ?? "Mixed"]) as PreferredMode[];
  const estimated = estimateMinutesForModes(distanceKm, modes);

  const { data, error } = await supabase
    .from("ll_saved_routes")
    .insert({
      ...body,
      session_id: sessionId,
      preferred_mode: primaryMode(modes),
      preferred_modes: modes,
      origin_lat: origin.latitude,
      origin_lng: origin.longitude,
      destination_lat: destination.latitude,
      destination_lng: destination.longitude,
      distance_km: distanceKm,
      estimated_minutes: estimated
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ route: data }, { status: 201 });
}

async function resolveCoordinates(name: string, latitude?: number | null, longitude?: number | null) {
  if (typeof latitude === "number" && typeof longitude === "number" && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
    return { latitude, longitude };
  }

  if (name.trim().length < 3) return null;

  try {
    const baseUrl = process.env.NOMINATIM_SEARCH_URL ?? "https://nominatim.openstreetmap.org/search";
    const url = new URL(baseUrl);
    url.searchParams.set("q", name);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", process.env.NOMINATIM_COUNTRYCODES ?? "ph");

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "Kalakbay/0.1 route-create"
      }
    });
    if (!response.ok) return null;

    const [first] = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!first) return null;

    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon)
    };
  } catch {
    return null;
  }
}
