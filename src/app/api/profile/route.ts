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
  const sessionId = getRequestSessionId(request);
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
  const sessionId = getRequestSessionId(request);
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

  return NextResponse.json({ user: data });
}
