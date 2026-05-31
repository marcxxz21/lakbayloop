import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSessionId } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  school_or_workplace: z.string().min(2),
  preferred_mode: z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"])
});

export async function GET(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);

  const { data, error } = await supabase
    .from("ll_app_users")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ user: data });
}

export async function POST(request: Request) {
  const sessionId = await getRequestSessionId(request);
  const supabase = getSupabaseDataClient(sessionId);
  const body = profileSchema.parse(await request.json());

  const { data, error } = await supabase
    .from("ll_app_users")
    .upsert({
      session_id: sessionId,
      full_name: body.full_name,
      email: body.email || null,
      school_or_workplace: body.school_or_workplace,
      preferred_mode: body.preferred_mode,
      updated_at: new Date().toISOString()
    }, { onConflict: "session_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const routeError = await ensureStarterRoutes(supabase, sessionId);
  if (routeError) return NextResponse.json({ error: routeError.message }, { status: 500 });

  return NextResponse.json({ user: data });
}

async function ensureStarterRoutes(supabase: ReturnType<typeof getSupabaseDataClient>, sessionId: string) {
  const { count, error: countError } = await supabase
    .from("ll_saved_routes")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (countError) return countError;
  if ((count ?? 0) > 0) return null;

  const { error } = await supabase.from("ll_saved_routes").insert([
    {
      session_id: sessionId,
      route_name: "Home -> School",
      origin_name: "Home",
      origin_lat: 14.676,
      origin_lng: 121.043,
      destination_name: "School",
      destination_lat: 14.578,
      destination_lng: 120.985,
      preferred_mode: "Mixed",
      is_favorite: true,
      distance_km: 3.2,
      estimated_minutes: 28
    },
    {
      session_id: sessionId,
      route_name: "Campus -> Work",
      origin_name: "Campus",
      origin_lat: 14.583,
      origin_lng: 120.986,
      destination_name: "Work",
      destination_lat: 14.604,
      destination_lng: 121.02,
      preferred_mode: "Jeepney",
      is_favorite: false,
      distance_km: 5.8,
      estimated_minutes: 42
    }
  ]);

  return error;
}
