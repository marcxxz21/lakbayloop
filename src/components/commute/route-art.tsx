export function RouteArt({ compact = false }: { compact?: boolean }) {
  return (
    <svg viewBox="0 0 360 320" className={compact ? "h-48 w-full" : "h-full min-h-[320px] w-full"} fill="none" aria-hidden="true">
      <circle cx="180" cy="160" r="126" stroke="rgba(91,142,240,0.08)" />
      <circle cx="180" cy="160" r="88" stroke="rgba(91,142,240,0.08)" />
      <circle cx="180" cy="160" r="52" stroke="rgba(91,142,240,0.1)" />
      <path d="M72 254 C98 222 122 200 142 172 C164 140 162 118 184 96 C204 76 228 74 260 86" stroke="url(#routeLine)" strokeWidth="4" strokeLinecap="round" />
      <path d="M72 254 C112 242 148 230 184 210 C228 186 232 122 260 86" stroke="rgba(255,255,255,0.09)" strokeWidth="2" strokeDasharray="5 8" strokeLinecap="round" />
      <circle cx="72" cy="254" r="10" fill="rgba(62,201,167,0.15)" stroke="#3EC9A7" strokeWidth="2" />
      <circle cx="260" cy="86" r="10" fill="rgba(91,142,240,0.16)" stroke="#5B8EF0" strokeWidth="2" />
      <circle cx="184" cy="96" r="5" fill="#E8A84C" />
      <circle cx="142" cy="172" r="5" fill="#FFFFFF" fillOpacity=".75" />
      <defs>
        <linearGradient id="routeLine" x1="72" y1="254" x2="260" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3EC9A7" />
          <stop offset=".55" stopColor="#5B8EF0" />
          <stop offset="1" stopColor="#E8A84C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
