import { NextResponse } from "next/server";
import { z } from "zod";
import { getLocalAccountSessionId, normalizeAccountEmail } from "@/lib/session";
import { getSupabaseDataClient } from "@/lib/supabase/data";

const modeSchema = z.enum(["Walking", "Jeepney", "Bus", "Train", "Bike", "Car", "Mixed"]);

const localAuthSchema = z.object({
  action: z.enum(["login", "create"]),
  email: z.string().email(),
  full_name: z.string().min(2).optional(),
  school_or_workplace: z.string().min(2).optional(),
  preferred_mode: modeSchema.optional(),
  preferred_modes: z.array(modeSchema).min(1).optional()
});

export async function POST(request: Request) {
  const body = localAuthSchema.parse(await request.json());
  const email = normalizeAccountEmail(body.email);
  const sessionId = getLocalAccountSessionId(email);
  const supabase = getSupabaseDataClient(sessionId);

  const existing = await supabase
    .from("ll_app_users")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });

  if (body.action === "login" && !existing.data) {
    return NextResponse.json({ error: "No local Kalakbay profile found for this email. Create it first." }, { status: 404 });
  }

  if (body.action === "create" && (!body.full_name || !body.school_or_workplace)) {
    return NextResponse.json({ error: "Full name and common destination or area are required." }, { status: 422 });
  }

  if (body.action === "create") {
    const preferredModes = body.preferred_modes?.length ? body.preferred_modes : [body.preferred_mode ?? "Mixed"];
    const profile = await supabase
      .from("ll_app_users")
      .upsert({
        session_id: sessionId,
        full_name: body.full_name,
        email,
        school_or_workplace: body.school_or_workplace,
        preferred_mode: preferredModes[0],
        preferred_modes: preferredModes,
        updated_at: new Date().toISOString()
      }, { onConflict: "session_id" })
      .select("*")
      .single();

    if (profile.error) {
      return NextResponse.json({ error: profile.error.message }, { status: 500 });
    }

    return NextResponse.json({ session_id: sessionId, user: profile.data });
  }

  const profile = await supabase
    .from("ll_app_users")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (profile.error) {
    return NextResponse.json({ error: profile.error.message }, { status: 500 });
  }

  return NextResponse.json({ session_id: sessionId, user: profile.data });
}
