import { getBrowserSessionId, sessionHeaderName } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let bearerToken: string | undefined;
  let sessionId = getBrowserSessionId();

  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token && data.session.user?.id) {
      bearerToken = data.session.access_token;
      sessionId = data.session.user.id;
    }
  } catch {
    // Local demo mode still works when Supabase Auth is not configured.
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      [sessionHeaderName]: sessionId,
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload as T;
}
