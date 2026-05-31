import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sessionHeaderName } from "@/lib/session";

let cachedClients = new Map<string, SupabaseClient>();

export function getSupabaseDataClient(sessionId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  const cacheKey = `${url}:${key}:${sessionId}`;
  const cached = cachedClients.get(cacheKey);
  if (cached) return cached;

  const client = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        [sessionHeaderName]: sessionId
      }
    }
  });

  cachedClients.set(cacheKey, client);
  return client;
}
