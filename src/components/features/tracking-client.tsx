"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, ExternalLink, MapPin, Navigation, Pause, Play, Radar, Route } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { MetricCard } from "@/components/ui-custom/metric-card";
import { apiFetch } from "@/lib/api-client";
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
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            className="h-11 min-w-64 rounded-2xl border border-white/[0.08] bg-surface-soft px-4 text-sm text-white outline-none"
            value={routeId}
            onChange={(event) => setRouteId(event.target.value)}
          >
            <option value="">No route selected</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.route_name}</option>)}
          </select>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load}>
              <Crosshair className="size-4" />
              Refresh
            </Button>
            {tracking ? (
              <Button variant="secondary" onClick={stopTracking}>
                <Pause className="size-4" />
                Stop
              </Button>
            ) : (
              <Button onClick={startTracking}>
                <Play className="size-4" />
                Start Tracking
              </Button>
            )}
          </div>
        </div>
        {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
        {latestRoute && routeMapAvailable ? <RouteTrackerMap route={latestRoute} points={routePoints} current={mapPoint} /> : null}
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-surface">
          <iframe
            title="Realtime commute map"
            src={mapSrc}
            className="h-[360px] w-full border-0 xl:h-[420px]"
            loading="lazy"
          />
        </div>
      </section>
      <aside className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard label="Tracker" value={tracking ? "Live" : "Idle"} sub={saving ? "Saving point..." : "Geolocation watch"} tone={tracking ? "teal" : "blue"} icon={Radar} />
          <MetricCard label="Points" value={String(points.length)} sub="Recent samples" tone="amber" icon={MapPin} />
          <MetricCard label="Route" value={routeMapAvailable ? "Point to point" : "Location"} sub={latestRoute?.estimated_minutes ? `${latestRoute.estimated_minutes} min estimate` : "Select a saved route"} tone="teal" icon={Route} />
        </div>
        <DarkCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Current route</p>
          <h2 className="mt-2 font-heading text-2xl font-black">{latestRoute?.route_name ?? "Realtime location"}</h2>
          <div className="mt-5 space-y-3 text-sm text-white/62">
            <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Latitude</span><b className="text-white">{lat.toFixed(5)}</b></div>
            <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Longitude</span><b className="text-white">{lng.toFixed(5)}</b></div>
            <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Accuracy</span><b className="text-white">{mapPoint?.accuracy_m ? `${Math.round(mapPoint.accuracy_m)}m` : "Unknown"}</b></div>
            <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Updated</span><b className="text-white">{mapPoint ? new Date(mapPoint.recorded_at).toLocaleTimeString() : "Waiting"}</b></div>
          </div>
          {directionsUrl ? (
            <Button variant="secondary" className="mt-5 w-full" asChild>
              <a href={directionsUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Open directions
              </a>
            </Button>
          ) : null}
        </DarkCard>
      </aside>
    </div>
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

function RouteTrackerMap({
  route,
  points,
  current
}: {
  route: SavedRoute;
  points: TrackingPoint[];
  current: TrackingPoint | null;
}) {
  const origin = { lat: Number(route.origin_lat), lng: Number(route.origin_lng) };
  const destination = { lat: Number(route.destination_lat), lng: Number(route.destination_lng) };
  const trackedPoints = points
    .slice()
    .reverse()
    .map((point) => ({ lat: Number(point.latitude), lng: Number(point.longitude) }));
  const currentPoint = current ? { lat: Number(current.latitude), lng: Number(current.longitude) } : null;
  const allPoints = [origin, destination, ...trackedPoints, ...(currentPoint ? [currentPoint] : [])];
  const minLat = Math.min(...allPoints.map((point) => point.lat));
  const maxLat = Math.max(...allPoints.map((point) => point.lat));
  const minLng = Math.min(...allPoints.map((point) => point.lng));
  const maxLng = Math.max(...allPoints.map((point) => point.lng));
  const latSpan = Math.max(maxLat - minLat, 0.003);
  const lngSpan = Math.max(maxLng - minLng, 0.003);

  function project(point: { lat: number; lng: number }) {
    const x = 52 + ((point.lng - minLng) / lngSpan) * 636;
    const y = 358 - ((point.lat - minLat) / latSpan) * 276;
    return { x, y };
  }

  const start = project(origin);
  const end = project(destination);
  const routeLine = `M ${start.x} ${start.y} C ${(start.x + end.x) / 2} ${start.y - 80}, ${(start.x + end.x) / 2} ${end.y + 80}, ${end.x} ${end.y}`;
  const sampledLine = trackedPoints.map(project).map((point) => `${point.x},${point.y}`).join(" ");
  const livePoint = currentPoint ? project(currentPoint) : null;

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-surface">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Point to point route</p>
        <h2 className="mt-1 font-heading text-xl font-black">{route.origin_name} to {route.destination_name}</h2>
      </div>
      <svg viewBox="0 0 740 420" className="h-[460px] w-full bg-[#080b10]" role="img" aria-label={`${route.route_name} point to point route`}>
        <defs>
          <pattern id="trackingGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
          </pattern>
          <linearGradient id="trackingRoute" x1="0" x2="1">
            <stop offset="0%" stopColor="#3ec9a7" />
            <stop offset="58%" stopColor="#5b8ef0" />
            <stop offset="100%" stopColor="#e8a84c" />
          </linearGradient>
        </defs>
        <rect width="740" height="420" fill="url(#trackingGrid)" />
        <path d={routeLine} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="18" strokeLinecap="round" />
        <path d={routeLine} fill="none" stroke="url(#trackingRoute)" strokeWidth="6" strokeLinecap="round" />
        {sampledLine ? <polyline points={sampledLine} fill="none" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}
        <circle cx={start.x} cy={start.y} r="15" fill="rgba(62,201,167,0.18)" stroke="#3ec9a7" strokeWidth="3" />
        <circle cx={end.x} cy={end.y} r="15" fill="rgba(232,168,76,0.18)" stroke="#e8a84c" strokeWidth="3" />
        {livePoint ? (
          <>
            <circle cx={livePoint.x} cy={livePoint.y} r="22" fill="rgba(91,142,240,0.14)" />
            <circle cx={livePoint.x} cy={livePoint.y} r="8" fill="#5b8ef0" stroke="white" strokeWidth="2" />
          </>
        ) : null}
        <g transform={`translate(${Math.min(start.x + 18, 540)} ${Math.max(start.y - 18, 34)})`}>
          <rect width="128" height="34" rx="17" fill="rgba(8,11,16,0.78)" stroke="rgba(255,255,255,0.1)" />
          <text x="14" y="22" fill="white" fontSize="13" fontWeight="700">Start</text>
        </g>
        <g transform={`translate(${Math.min(end.x + 18, 540)} ${Math.max(end.y - 18, 34)})`}>
          <rect width="128" height="34" rx="17" fill="rgba(8,11,16,0.78)" stroke="rgba(255,255,255,0.1)" />
          <text x="14" y="22" fill="white" fontSize="13" fontWeight="700">End</text>
        </g>
      </svg>
    </div>
  );
}
