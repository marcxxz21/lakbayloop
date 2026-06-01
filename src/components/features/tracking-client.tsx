"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, Crosshair, ExternalLink, LocateFixed, Navigation, Pause, Volume2 } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { calculateDistanceKm } from "@/lib/commute-calculations";
import type { SavedRoute, TrackingPoint } from "@/lib/types";

type TrackingResponse = { points: TrackingPoint[] };

export function TrackingClient() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [routeId, setRouteId] = useState("");
  const [points, setPoints] = useState<TrackingPoint[]>([]);
  const [current, setCurrent] = useState<TrackingPoint | null>(null);
  const [tracking, setTracking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  async function load() {
    const [routesResult, trackingResult] = await Promise.all([
      apiFetch<{ routes: SavedRoute[] }>("/api/routes"),
      apiFetch<TrackingResponse>("/api/tracking?limit=80")
    ]);
    setRoutes(routesResult.routes);
    setPoints(trackingResult.points);
    setCurrent(trackingResult.points[0] ?? null);
    setRouteId((existing) => existing || trackingResult.points[0]?.route_id || routesResult.routes[0]?.id || "");
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Unable to load tracking"));

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  async function savePosition(position: GeolocationPosition) {
    setSaving(true);
    try {
      const result = await apiFetch<{ point: TrackingPoint }>("/api/tracking", {
        method: "POST",
        body: JSON.stringify({
          route_id: routeId || null,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
          speed_mps: position.coords.speed,
          heading_degrees: position.coords.heading,
          recorded_at: new Date(position.timestamp).toISOString()
        })
      });
      setCurrent(result.point);
      setPoints((items) => [result.point, ...items].slice(0, 80));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save location");
    } finally {
      setSaving(false);
    }
  }

  function startTracking() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available in this browser.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        savePosition(position);
      },
      (geoError) => {
        setError(geoError.message || "Location permission was denied.");
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    setTracking(true);
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }

  const latestRoute = routes.find((route) => route.id === routeId);
  const routePoints = points.filter((point) => !routeId || point.route_id === routeId);
  const routeMapAvailable = Boolean(
    latestRoute?.origin_lat &&
    latestRoute?.origin_lng &&
    latestRoute?.destination_lat &&
    latestRoute?.destination_lng
  );
  const mapPoint = current ?? routePoints[0] ?? points[0];
  const directionsUrl = latestRoute && routeMapAvailable
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${latestRoute.origin_lat}%2C${latestRoute.origin_lng}%3B${latestRoute.destination_lat}%2C${latestRoute.destination_lng}`
    : null;

  const content = (
    <NavigationMap
      routes={routes}
      routeId={routeId}
      onRouteChange={setRouteId}
      route={latestRoute}
      points={routePoints}
      current={mapPoint}
      tracking={tracking}
      saving={saving}
      error={error}
      directionsUrl={directionsUrl}
      onRefresh={load}
      onStart={startTracking}
      onStop={stopTracking}
    />
  );

  const mobile = content;

  return (
    <ResponsiveShell title="Tracking" subtitle="Track live commute position and save location samples to Supabase." mobile={mobile} mobileFullScreen>
      {content}
    </ResponsiveShell>
  );
}

function NavigationMap({
  routes,
  routeId,
  onRouteChange,
  route,
  points,
  current,
  tracking,
  saving,
  error,
  directionsUrl,
  onRefresh,
  onStart,
  onStop
}: {
  routes: SavedRoute[];
  routeId: string;
  onRouteChange: (routeId: string) => void;
  route?: SavedRoute;
  points: TrackingPoint[];
  current: TrackingPoint | null;
  tracking: boolean;
  saving: boolean;
  error: string | null;
  directionsUrl: string | null;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const [clockNow, setClockNow] = useState<number | null>(null);
  const routeMapAvailable = Boolean(route?.origin_lat && route?.origin_lng && route?.destination_lat && route?.destination_lng);
  const destination = routeMapAvailable ? { lat: Number(route?.destination_lat), lng: Number(route?.destination_lng) } : null;
  const currentPoint = current ? { lat: Number(current.latitude), lng: Number(current.longitude) } : null;
  const remainingKm = currentPoint && destination
    ? calculateDistanceKm(currentPoint.lat, currentPoint.lng, destination.lat, destination.lng)
    : Number(route?.distance_km ?? 0);
  const etaMinutes = currentPoint && destination && route?.distance_km
    ? Math.max(1, Math.round((remainingKm / Math.max(Number(route.distance_km), 1)) * route.estimated_minutes))
    : route?.estimated_minutes ?? 0;
  const speedKmh = current?.speed_mps ? Math.max(0, Math.round(Number(current.speed_mps) * 3.6)) : estimateSpeedLabel(route?.preferred_mode);
  const nextDistanceKm = Math.min(Math.max(remainingKm, 0.1), 0.3);
  const arrivalTime = clockNow && etaMinutes ? new Date(clockNow + etaMinutes * 60000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--";
  const destinationLabel = shortPlaceName(route?.destination_name ?? "destination");
  const originLabel = shortPlaceName(route?.origin_name ?? "start");
  const nextInstruction = route ? `Continue toward ${destinationLabel}` : "Choose a saved route";

  useEffect(() => {
    setClockNow(Date.now());
    const interval = window.setInterval(() => setClockNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef1f4] text-[#111318] lg:min-h-[720px] lg:rounded-[28px] lg:border lg:border-white/[0.08]">
      <svg viewBox="0 0 390 680" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-label={route ? `${route.route_name} navigation map` : "Navigation map"}>
        <defs>
          <filter id="navShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0a0b0f" floodOpacity="0.22" />
          </filter>
        </defs>
        <rect width="390" height="680" fill="#eef1f4" />
        <g stroke="#c6ccd4" strokeWidth="5" strokeLinecap="round">
          <path d="M -20 92 H 420" />
          <path d="M -20 176 H 420" />
          <path d="M -20 272 H 420" />
          <path d="M -20 366 H 420" />
          <path d="M -20 514 H 420" />
          <path d="M 54 -20 V 720" />
          <path d="M 138 -20 V 720" />
          <path d="M 254 -20 V 720" />
          <path d="M 338 -20 V 720" />
          <path d="M -20 638 C 78 590 116 594 196 626 S 312 666 420 622" />
        </g>
        <g stroke="#fafafa" strokeWidth="2" strokeLinecap="round" opacity="0.72">
          <path d="M -20 92 H 420" />
          <path d="M -20 176 H 420" />
          <path d="M -20 272 H 420" />
          <path d="M -20 366 H 420" />
          <path d="M -20 514 H 420" />
          <path d="M 54 -20 V 720" />
          <path d="M 138 -20 V 720" />
          <path d="M 254 -20 V 720" />
          <path d="M 338 -20 V 720" />
        </g>
        <path d="M 195 600 L 195 426 L 254 426 L 254 270 L 138 270 L 138 146" fill="none" stroke="#2318c9" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" filter="url(#navShadow)" />
        <path d="M 195 600 L 195 426 L 254 426 L 254 270 L 138 270 L 138 146" fill="none" stroke="#5c48ff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 195 600 L 195 540" stroke="#48f0bd" strokeWidth="8" strokeLinecap="round" />
        <path d="M 254 426 h-42" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <path d="M 214 418 l-10 8 l10 8" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="translate(166 525)" filter="url(#navShadow)">
          <path d="M29 0 L54 62 L31 52 L8 62 Z" fill="#12b8ff" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
          <path d="M29 12 L41 46 L29 40 L17 46 Z" fill="#172033" opacity="0.42" />
        </g>
        <g transform="translate(110 250)">
          <rect width="88" height="28" rx="14" fill="#5c48ff" />
          <text x="44" y="18" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">{destinationLabel.slice(0, 11)}</text>
        </g>
        <g transform="translate(166 588)">
          <rect width="74" height="28" rx="14" fill="#5c48ff" />
          <text x="37" y="18" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">{originLabel.slice(0, 9)}</text>
        </g>
      </svg>

      <div className="absolute left-0 right-0 top-0 bg-[#050608] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+14px)] text-white shadow-[0_12px_28px_rgba(0,0,0,0.24)]">
        <div className="flex items-center gap-3">
          <button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10" aria-label="Back">
            <ChevronLeft className="size-6" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Navigation className="size-8 shrink-0 -rotate-45 text-white" />
              <div className="min-w-0">
                <p className="font-heading text-xl font-black leading-none">{nextDistanceKm.toFixed(1)} km</p>
                <p className="mt-1 truncate text-sm font-bold text-blue">{nextInstruction}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+112px)] grid gap-3">
        <button type="button" className="flex size-11 items-center justify-center rounded-full bg-white text-[#20242a] shadow-panel" aria-label="Voice guidance">
          <Volume2 className="size-5" />
        </button>
        <button type="button" className="flex size-11 items-center justify-center rounded-full bg-pink-500 text-white shadow-panel" aria-label="Report alert">
          <AlertTriangle className="size-5" />
        </button>
      </div>

      <div className="absolute bottom-[184px] left-5 flex size-14 flex-col items-center justify-center rounded-full border-4 border-[#2f363d] bg-[#45515c] text-white shadow-panel">
        <span className="font-heading text-lg font-black leading-none">{speedKmh || 35}</span>
        <span className="text-[10px] font-bold leading-none">km/h</span>
      </div>

      <div className="absolute bottom-[188px] right-5 flex size-14 items-center justify-center rounded-full bg-white text-[#111318] shadow-panel">
        <AlertTriangle className="size-7 text-amber" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 rounded-t-[26px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-4 text-[#111318] shadow-[0_-16px_34px_rgba(0,0,0,0.18)]">
        <div className="grid grid-cols-3 items-center gap-2 text-center">
          <div>
            <p className="font-heading text-lg font-black">{etaMinutes || "--"} min</p>
            <p className="mt-1 text-[11px] font-semibold text-black/45">ETA</p>
          </div>
          <div>
            <p className="font-heading text-lg font-black">{arrivalTime}</p>
            <p className="mt-1 text-[11px] font-semibold text-black/45">Arrival</p>
          </div>
          <div>
            <p className="font-heading text-lg font-black">{remainingKm ? `${remainingKm.toFixed(1)} km` : "--"}</p>
            <p className="mt-1 text-[11px] font-semibold text-black/45">Distance</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
          <select className="h-11 min-w-0 rounded-2xl border border-black/10 bg-black/[0.04] px-3 text-sm font-semibold outline-none" value={routeId} onChange={(event) => onRouteChange(event.target.value)}>
            <option value="">No route selected</option>
            {routes.map((item) => <option key={item.id} value={item.id}>{item.route_name}</option>)}
          </select>
          <Button variant="secondary" size="icon" onClick={onRefresh} aria-label="Refresh tracking">
            <Crosshair className="size-4" />
          </Button>
          {directionsUrl ? (
            <Button variant="secondary" size="icon" asChild>
              <a href={directionsUrl} target="_blank" rel="noreferrer" aria-label="Open directions">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>
        <div className="mt-3">
          {tracking ? (
            <Button className="w-full" variant="secondary" onClick={onStop}>
              <Pause className="size-4" />
              Stop tracking
            </Button>
          ) : (
            <Button className="w-full" onClick={onStart}>
              <LocateFixed className="size-4" />
              Start tracking
            </Button>
          )}
        </div>
        {saving ? <p className="mt-3 text-xs font-semibold text-teal">Saving latest point...</p> : null}
        {error ? <p className="mt-3 rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-2 text-xs text-red">{error}</p> : null}
      </div>
    </div>
  );
}

function shortPlaceName(value: string) {
  return value.split(",")[0]?.trim() || value;
}

function estimateSpeedLabel(mode?: string) {
  if (mode === "Walking") return 5;
  if (mode === "Bike") return 14;
  if (mode === "Train") return 35;
  if (mode === "Car") return 35;
  if (mode === "Bus") return 24;
  return 18;
}
