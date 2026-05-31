export const demoSessionId = "demo";
export const sessionHeaderName = "x-lakbayloop-session";

export function getBrowserSessionId() {
  if (typeof window === "undefined") return demoSessionId;

  const existing = window.localStorage.getItem("lakbayloop_session_id");
  if (existing) return existing;

  window.localStorage.setItem("lakbayloop_session_id", demoSessionId);
  return demoSessionId;
}

export function getRequestSessionId(request: Request) {
  return request.headers.get(sessionHeaderName) || demoSessionId;
}
