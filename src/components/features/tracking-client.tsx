"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, MapPin, Navigation, Pause, Play, Radar } from "lucide-react";
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

  const mapPoint = current ?? points[0];
  const lat = Number(mapPoint?.latitude ?? process.env.NEXT_PUBLIC_DEFAULT_MAP_LAT ?? 14.5995);
  const lng = Number(mapPoint?.longitude ?? process.env.NEXT_PUBLIC_DEFAULT_MAP_LNG ?? 120.9842);
  const mapSrc = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_OSM_EMBED_BASE ?? "https://www.openstreetmap.org/export/embed.html";
    const pad = 0.01;
    const params = new URLSearchParams({
      bbox: `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`,
      layer: "mapnik",
      marker: `${lat},${lng}`
    });
    return `${base}?${params.toString()}`;
  }, [lat, lng]);

  const latestRoute = routes.find((route) => route.id === routeId);
  const content = (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4">
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
        <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-surface">
          <iframe
            title="Realtime commute map"
            src={mapSrc}
            className="h-[460px] w-full border-0"
            loading="lazy"
          />
        </div>
      </section>
      <aside className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard label="Tracker" value={tracking ? "Live" : "Idle"} sub={saving ? "Saving point..." : "Geolocation watch"} tone={tracking ? "teal" : "blue"} icon={Radar} />
          <MetricCard label="Points" value={String(points.length)} sub="Recent samples" tone="amber" icon={MapPin} />
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
        </DarkCard>
      </aside>
    </div>
  );

  const mobile = (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-white/38">Realtime commute</p>
        <h1 className="font-heading text-4xl font-black">Tracking</h1>
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
