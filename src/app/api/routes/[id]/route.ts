import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateDistanceKm, estimateMinutesForModes, primaryMode } from "@/lib/commute-calculations";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";
import type { PreferredMode } from "@/lib/types";

const patchSchema = z.object({
  route_name: z.string().min(2).optional(),
  origin_name: z.string().min(1).optional(),
  origin_lat: z.coerce.number().optional().nullable(),
  origin_lng: z.coerce.number().optional().nullable(),
  destination_name: z.string().min(1).optional(),
  destination_lat: z.coerce.number().optional().nullable(),
  destination_lng: z.coerce.number().optional().nullable(),
  preferred_mode: z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"]).optional(),
  preferred_modes: z.array(z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"])).min(1).optional(),
  is_favorite: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const body = patchSchema.parse(await request.json());

  const { data: current, error: currentError } = await supabase
    .from("ll_saved_routes")
    .select("*")
    .eq("session_id", sessionId)
    .eq("id", id)
    .single();

  if (currentError) return NextResponse.json({ error: currentError.message }, { status: 404 });

  const merged = { ...current, ...body };
  const distanceKm = calculateDistanceKm(merged.origin_lat, merged.origin_lng, merged.destination_lat, merged.destination_lng);
  const modes = (merged.preferred_modes?.length ? merged.preferred_modes : [merged.preferred_mode ?? "Mixed"]) as PreferredMode[];
  const estimated = estimateMinutesForModes(distanceKm, modes);

  const { data, error } = await supabase
    .from("ll_saved_routes")
    .update({
      ...body,
      preferred_mode: body.preferred_modes ? primaryMode(modes) : body.preferred_mode,
      preferred_modes: modes,
      distance_km: distanceKm,
      estimated_minutes: estimated,
      updated_at: new Date().toISOString()
    })
    .eq("session_id", sessionId)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ route: data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const { error } = await supabase
    .from("ll_saved_routes")
    .delete()
    .eq("session_id", sessionId)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
