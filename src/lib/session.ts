import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const demoSessionId = "demo";
export const sessionHeaderName = "x-lakbayloop-session";

export function normalizeAccountEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getLocalAccountSessionId(email: string) {
  return `local:${normalizeAccountEmail(email)}`;
}

const accountEmailsKey = "lakbayloop_account_emails";
const browserSessionKey = "lakbayloop_session_id";

function createGuestSessionId() {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `guest:${id}`;
}

export function getRememberedAccountEmails() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(accountEmailsKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function rememberAccountEmail(email: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeAccountEmail(email);
  const emails = getRememberedAccountEmails();
  if (emails.includes(normalized)) return;
  window.localStorage.setItem(accountEmailsKey, JSON.stringify([...emails, normalized]));
}

export function getBrowserSessionId() {
  if (typeof window === "undefined") return demoSessionId;

  const existing = window.localStorage.getItem(browserSessionKey);
  if (existing && existing !== demoSessionId) return existing;

  const sessionId = createGuestSessionId();
  window.localStorage.setItem(browserSessionKey, sessionId);
  return sessionId;
}

export function setBrowserSessionId(sessionId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(browserSessionKey, sessionId);
}

export function clearBrowserSessionId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(browserSessionKey);
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
