import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";

const trackingSchema = z.object({
  route_id: z.string().uuid().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy_m: z.coerce.number().nonnegative().optional().nullable(),
  speed_mps: z.coerce.number().nonnegative().optional().nullable(),
  heading_degrees: z.coerce.number().min(0).max(360).optional().nullable(),
  recorded_at: z.string().datetime().optional()
});

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const { data, error } = await supabase
    .from("ll_tracking_points")
    .select("*")
    .eq("session_id", sessionId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ points: data ?? [] });
}

export async function POST(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const body = trackingSchema.parse(await request.json());

  const { data, error } = await supabase
    .from("ll_tracking_points")
    .insert({
      session_id: sessionId,
      route_id: body.route_id || null,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy_m: body.accuracy_m ?? null,
      speed_mps: body.speed_mps ?? null,
      heading_degrees: body.heading_degrees ?? null,
      recorded_at: body.recorded_at ?? new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ point: data }, { status: 201 });
}
