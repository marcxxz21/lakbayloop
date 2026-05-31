import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const demoSessionId = "demo";
export const sessionHeaderName = "x-lakbayloop-session";

export function getBrowserSessionId() {
  if (typeof window === "undefined") return demoSessionId;

  const existing = window.localStorage.getItem("lakbayloop_session_id");
  if (existing) return existing;

  window.localStorage.setItem("lakbayloop_session_id", demoSessionId);
  return demoSessionId;
}

export function setBrowserSessionId(sessionId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("lakbayloop_session_id", sessionId);
}

export function clearBrowserSessionId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("lakbayloop_session_id");
}

export async function getRequestSessionId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const userId = token ? await getUserIdFromToken(token) : null;

  return userId || request.headers.get(sessionHeaderName) || demoSessionId;
}

async function getUserIdFromToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const supabase = createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;

  return data.user?.id ?? null;
}
