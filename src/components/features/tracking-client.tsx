"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, ExternalLink, LocateFixed, MapPin, Navigation, Pause, Play } from "lucide-react";
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
  const lat = Number(mapPoint?.latitude ?? latestRoute?.origin_lat ?? process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT ?? 14.5995);
  const lng = Number(mapPoint?.longitude ?? latestRoute?.origin_lng ?? process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG ?? 120.9842);
  const mapSrc = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_OSM_EMBED_BASE ?? "https://www.openstreetmap.org/export/embed.html";
    const routeLats = routeMapAvailable ? [Number(latestRoute?.origin_lat), Number(latestRoute?.destination_lat)] : [lat];
    const routeLngs = routeMapAvailable ? [Number(latestRoute?.origin_lng), Number(latestRoute?.destination_lng)] : [lng];
    const minLat = Math.min(lat, ...routeLats);
    const maxLat = Math.max(lat, ...routeLats);
    const minLng = Math.min(lng, ...routeLngs);
    const maxLng = Math.max(lng, ...routeLngs);
    const pad = 0.01;
    const params = new URLSearchParams({
      bbox: `${minLng - pad},${minLat - pad},${maxLng + pad},${maxLat + pad}`,
      layer: "mapnik",
      marker: `${lat},${lng}`
    });
    return `${base}?${params.toString()}`;
  }, [lat, latestRoute?.destination_lat, latestRoute?.destination_lng, latestRoute?.origin_lat, latestRoute?.origin_lng, lng, routeMapAvailable]);
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
      mapSrc={mapSrc}
      tracking={tracking}
      saving={saving}
      error={error}
      directionsUrl={directionsUrl}
      onRefresh={load}
      onStart={startTracking}
      onStop={stopTracking}
    />
  );

  const mobile = (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-white/38">Realtime commute</p>
        <h1 className="font-heading text-3xl font-black">Tracking</h1>
      </header>
      {content}
    </div>
  );

  return (
    <ResponsiveShell title="Tracking" subtitle="Track live commute position and save location samples to Supabase." mobile={mobile}>
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
  mapSrc,
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
  mapSrc: string;
  current: TrackingPoint | null;
  tracking: boolean;
  saving: boolean;
  error: string | null;
  directionsUrl: string | null;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const routeMapAvailable = Boolean(route?.origin_lat && route?.origin_lng && route?.destination_lat && route?.destination_lng);
  const origin = routeMapAvailable ? { lat: Number(route?.origin_lat), lng: Number(route?.origin_lng) } : null;
  const destination = routeMapAvailable ? { lat: Number(route?.destination_lat), lng: Number(route?.destination_lng) } : null;
  const trackedPoints = points
    .slice()
    .reverse()
    .map((point) => ({ lat: Number(point.latitude), lng: Number(point.longitude) }));
  const currentPoint = current ? { lat: Number(current.latitude), lng: Number(current.longitude) } : null;
  const fallbackPoint = { lat: 14.5995, lng: 120.9842 };
  const allPoints = [origin, destination, ...trackedPoints, currentPoint].filter(Boolean) as Array<{ lat: number; lng: number }>;
  const plottedPoints = allPoints.length ? allPoints : [fallbackPoint];
  const minLat = Math.min(...plottedPoints.map((point) => point.lat));
  const maxLat = Math.max(...plottedPoints.map((point) => point.lat));
  const minLng = Math.min(...plottedPoints.map((point) => point.lng));
  const maxLng = Math.max(...plottedPoints.map((point) => point.lng));
  const latSpan = Math.max(maxLat - minLat, 0.003);
  const lngSpan = Math.max(maxLng - minLng, 0.003);
  const remainingKm = currentPoint && destination
    ? calculateDistanceKm(currentPoint.lat, currentPoint.lng, destination.lat, destination.lng)
    : Number(route?.distance_km ?? 0);
  const etaMinutes = currentPoint && destination && route?.distance_km
    ? Math.max(1, Math.round((remainingKm / Math.max(Number(route.distance_km), 1)) * route.estimated_minutes))
    : route?.estimated_minutes ?? 0;

  function project(point: { lat: number; lng: number }) {
    const x = 8 + ((point.lng - minLng) / lngSpan) * 84;
    const y = 88 - ((point.lat - minLat) / latSpan) * 76;
    return { x, y };
  }

  const start = origin ? project(origin) : null;
  const end = destination ? project(destination) : null;
  const routeLine = start && end ? `M ${start.x} ${start.y} C ${(start.x + end.x) / 2} ${start.y - 18}, ${(start.x + end.x) / 2} ${end.y + 18}, ${end.x} ${end.y}` : "";
  const sampledLine = trackedPoints.map(project).map((point) => `${point.x},${point.y}`).join(" ");
  const livePoint = currentPoint ? project(currentPoint) : null;

  return (
    <div className="relative min-h-[calc(100svh-150px)] overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface shadow-panel lg:min-h-[720px]">
      <iframe title="Realtime commute map" src={mapSrc} className="absolute inset-0 h-full w-full border-0" loading="lazy" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.72),rgba(5,6,8,0.08)_32%,rgba(5,6,8,0.08)_56%,rgba(5,6,8,0.86))]" />
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-label={route ? `${route.route_name} navigation route` : "Realtime location map"}>
        <defs>
          <linearGradient id="navigationRoute" x1="0" x2="1">
            <stop offset="0%" stopColor="#3ec9a7" />
            <stop offset="62%" stopColor="#5b8ef0" />
            <stop offset="100%" stopColor="#e8a84c" />
          </linearGradient>
        </defs>
        {routeLine ? <path d={routeLine} fill="none" stroke="rgba(8,11,16,0.58)" strokeWidth="4.8" strokeLinecap="round" /> : null}
        {routeLine ? <path d={routeLine} fill="none" stroke="url(#navigationRoute)" strokeWidth="2.4" strokeLinecap="round" /> : null}
        {sampledLine ? <polyline points={sampledLine} fill="none" stroke="white" strokeOpacity="0.82" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {start ? <circle cx={start.x} cy={start.y} r="2.3" fill="#3ec9a7" stroke="#071016" strokeWidth="1.1" /> : null}
        {end ? <circle cx={end.x} cy={end.y} r="2.3" fill="#e8a84c" stroke="#071016" strokeWidth="1.1" /> : null}
        {livePoint ? (
          <>
            <circle cx={livePoint.x} cy={livePoint.y} r="5" fill="rgba(91,142,240,0.22)" />
            <circle cx={livePoint.x} cy={livePoint.y} r="2.5" fill="#5b8ef0" stroke="white" strokeWidth="0.9" />
          </>
        ) : null}
      </svg>
      <div className="absolute left-3 right-3 top-3 space-y-2 sm:left-4 sm:right-4 sm:top-4">
        <div className="rounded-[22px] border border-white/10 bg-[#080b10]/88 p-3 shadow-panel backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <select className="h-10 min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.06] px-3 text-sm text-white outline-none" value={routeId} onChange={(event) => onRouteChange(event.target.value)}>
              <option value="">No route selected</option>
              {routes.map((item) => <option key={item.id} value={item.id}>{item.route_name}</option>)}
            </select>
            <Button variant="secondary" size="icon" onClick={onRefresh} aria-label="Refresh tracking">
              <Crosshair className="size-4" />
            </Button>
          </div>
          {error ? <p className="mt-2 rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-2 text-xs text-red">{error}</p> : null}
        </div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
        <div className="rounded-[28px] border border-white/10 bg-[#080b10]/92 p-4 shadow-panel backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white/38">
                <Navigation className="size-3.5 text-blue" />
                {tracking ? "Live navigation" : "Route preview"}
              </p>
              <h2 className="mt-1 truncate font-heading text-xl font-black text-white">{route?.route_name ?? "Realtime location"}</h2>
              <p className="mt-1 truncate text-xs text-white/46">{route?.origin_name ?? "Choose a route"} {route ? "to" : ""} {route?.destination_name ?? ""}</p>
            </div>
            <div className="rounded-2xl bg-white text-[#080A0F] px-4 py-2 text-right">
              <p className="font-heading text-2xl font-black leading-none">{etaMinutes || "--"}m</p>
              <p className="mt-1 text-[10px] font-bold uppercase text-black/50">ETA</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/[0.055] p-3">
              <p className="text-[11px] text-white/38">Remaining</p>
              <p className="mt-1 font-heading text-base font-black">{remainingKm ? `${remainingKm.toFixed(1)} km` : "--"}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.055] p-3">
              <p className="text-[11px] text-white/38">Accuracy</p>
              <p className="mt-1 font-heading text-base font-black">{current?.accuracy_m ? `${Math.round(Number(current.accuracy_m))}m` : "--"}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.055] p-3">
              <p className="text-[11px] text-white/38">Points</p>
              <p className="mt-1 font-heading text-base font-black">{points.length}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            {tracking ? (
              <Button variant="secondary" onClick={onStop}>
                <Pause className="size-4" />
                Stop tracking
              </Button>
            ) : (
              <Button onClick={onStart}>
                <LocateFixed className="size-4" />
                Start tracking
              </Button>
            )}
            {directionsUrl ? (
              <Button variant="secondary" size="icon" asChild>
                <a href={directionsUrl} target="_blank" rel="noreferrer" aria-label="Open directions">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : null}
          </div>
          {saving ? <p className="mt-3 text-xs font-semibold text-teal">Saving latest point...</p> : null}
        </div>
      </div>
    </div>
  );
}
