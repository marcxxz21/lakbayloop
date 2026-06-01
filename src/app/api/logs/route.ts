import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";

const logSchema = z.object({
  route_id: z.string().uuid(),
  travel_date: z.string().min(8),
  actual_duration_minutes: z.coerce.number().int().positive().max(300),
  crowd_level: z.enum(["light", "moderate", "crowded", "very crowded"]),
  rating: z.coerce.number().int().min(1).max(5),
  preferred_modes: z.array(z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"])).min(1).optional(),
  notes: z.string().optional().nullable()
});

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const { data, error } = await supabase
    .from("ll_route_logs")
    .select("*, ll_saved_routes(route_name, preferred_mode, preferred_modes)")
    .eq("session_id", sessionId)
    .order("travel_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ logs: data ?? [] });
}

export async function POST(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const body = logSchema.parse(await request.json());
  const { data: route } = await supabase
    .from("ll_saved_routes")
    .select("preferred_mode, preferred_modes")
    .eq("session_id", sessionId)
    .eq("id", body.route_id)
    .maybeSingle();

  const preferredModes = body.preferred_modes?.length
    ? body.preferred_modes
    : route?.preferred_modes?.length
      ? route.preferred_modes
      : [route?.preferred_mode ?? "Mixed"];

  const { data, error } = await supabase
    .from("ll_route_logs")
    .insert({
      ...body,
      session_id: sessionId,
      preferred_modes: preferredModes,
      notes: body.notes || null
    })
    .select("*, ll_saved_routes(route_name, preferred_mode, preferred_modes)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ log: data }, { status: 201 });
}
