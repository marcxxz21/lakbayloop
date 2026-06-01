"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode, WheelEvent } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  Crosshair,
  ExternalLink,
  Layers,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Pause,
  Play,
  Plus,
  Radio,
  Save,
  Volume2,
  X
} from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { calculateDistanceMeters, calculateTrackedDistanceMeters } from "@/lib/tracking/distance";
import { cn } from "@/lib/utils";
import type { SavedRoute, TrackingPoint } from "@/lib/types";

type TrackingResponse = { points: TrackingPoint[] };
type DirectionStep = {
  instruction: string;
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  type: string;
  modifier: string | null;
  location: MapPoint | null;
};
type DirectionsResponse = {
  provider: string;
  distanceMeters: number;
  durationSeconds: number;
  points: MapPoint[];
  steps: DirectionStep[];
};
type TrackingStatus = "idle" | "requesting-permission" | "tracking" | "paused" | "ended" | "error";
type LocationPoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
};
type MapPoint = { latitude: number; longitude: number };
type PixelPoint = { x: number; y: number };

const geoOptions: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 3000,
  timeout: 15000
};

const defaultCenter = { latitude: 14.5995, longitude: 120.9842 };
const tileSize = 256;
const minMapZoom = 10;
const maxMapZoom = 18;

export function TrackingClient() {
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [routeId, setRouteId] = useState("");
  const [historyPoints, setHistoryPoints] = useState<TrackingPoint[]>([]);
  const [currentPosition, setCurrentPosition] = useState<LocationPoint | null>(null);
  const [sessionPoints, setSessionPoints] = useState<LocationPoint[]>([]);
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [manualCenter, setManualCenter] = useState<MapPoint | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [directions, setDirections] = useState<DirectionsResponse | null>(null);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const routeIdRef = useRef(routeId);

  const selectedRoute = routes.find((route) => route.id === routeId);
  const latestHistoryPoint = historyPoints.find((point) => !routeId || point.route_id === routeId);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const point = toLocationPoint(position);
    setCurrentPosition(point);
    setSessionPoints((items) => [...items, point].slice(-400));
    setIsFollowingUser(true);
    savePoint(point, routeIdRef.current, setSaving, setErrorMessage);
  }, []);

  async function load() {
    setErrorMessage(null);
    const [routesResult, trackingResult] = await Promise.all([
      apiFetch<{ routes: SavedRoute[] }>("/api/routes"),
      apiFetch<TrackingResponse>("/api/tracking?limit=120")
    ]);
    setRoutes(routesResult.routes);
    setHistoryPoints(trackingResult.points);
    setCurrentPosition((current) => current ?? (trackingResult.points[0] ? trackingPointToLocationPoint(trackingResult.points[0]) : null));
    setRouteId((existing) => existing || trackingResult.points[0]?.route_id || routesResult.routes[0]?.id || "");
  }

  useEffect(() => {
    routeIdRef.current = routeId;
  }, [routeId]);

  useEffect(() => {
    load().catch((err) => setErrorMessage(err instanceof Error ? err.message : "Unable to load tracking"));

    return () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!startedAt || !["requesting-permission", "tracking", "paused"].includes(trackingStatus)) return;

    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt, trackingStatus]);

  function beginTracking(resetSession = true) {
    setErrorMessage(null);
    setNotice(null);

    if (!("geolocation" in navigator)) {
      setTrackingStatus("error");
      setErrorMessage("This browser does not support location tracking.");
      return;
    }

    if (watchIdRef.current !== null) return;

    if (resetSession) {
      setSessionPoints([]);
      setStartedAt(Date.now());
      setEndedAt(null);
      setElapsedSeconds(0);
    }

    setTrackingStatus("requesting-permission");
    setIsFollowingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handlePosition(position);
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePosition,
          (geoError) => handleGeoError(geoError, true),
          geoOptions
        );
        setTrackingStatus("tracking");
      },
      (geoError) => handleGeoError(geoError, false),
      geoOptions
    );
  }

  function handleGeoError(geoError: GeolocationPositionError, fromWatcher: boolean) {
    setErrorMessage(getGeoErrorMessage(geoError));
    if (!fromWatcher) {
      setTrackingStatus("error");
      return;
    }
    stopWatcher();
    setTrackingStatus("error");
  }

  function pauseTracking() {
    stopWatcher();
    setTrackingStatus("paused");
  }

  function endTracking() {
    stopWatcher();
    setEndedAt(Date.now());
    setTrackingStatus("ended");
    if (startedAt) setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
  }

  function stopWatcher() {
    if (watchIdRef.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  async function saveSummaryAsLog() {
    if (!selectedRoute) {
      setNotice("Choose a route before saving this commute as a log.");
      return;
    }

    setSavingSummary(true);
    setNotice(null);
    try {
      await apiFetch("/api/logs", {
        method: "POST",
        body: JSON.stringify({
          route_id: selectedRoute.id,
          travel_date: new Date().toISOString().slice(0, 10),
          actual_duration_minutes: Math.max(1, Math.round(elapsedSeconds / 60)),
          crowd_level: "moderate",
          rating: 4,
          notes: `Tracked ${formatDistanceMeters(trackedDistanceMeters)} with ${sessionPoints.length} location points.`
        })
      });
      setNotice("Commute saved as a ride log.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to save commute log.");
    } finally {
      setSavingSummary(false);
    }
  }

  const trackedDistanceMeters = useMemo(() => calculateTrackedDistanceMeters(sessionPoints), [sessionPoints]);
  const currentSpeedKmh = useMemo(() => getSpeedKmh(currentPosition, sessionPoints), [currentPosition, sessionPoints]);
  const destination = selectedRoute?.destination_lat !== null && selectedRoute?.destination_lat !== undefined && selectedRoute?.destination_lng !== null && selectedRoute?.destination_lng !== undefined
    ? { latitude: Number(selectedRoute.destination_lat), longitude: Number(selectedRoute.destination_lng) }
    : null;
  const origin = selectedRoute?.origin_lat !== null && selectedRoute?.origin_lat !== undefined && selectedRoute?.origin_lng !== null && selectedRoute?.origin_lng !== undefined
    ? { latitude: Number(selectedRoute.origin_lat), longitude: Number(selectedRoute.origin_lng) }
    : null;

  useEffect(() => {
    if (!origin || !destination) {
      setDirections(null);
      setDirectionsError(null);
      setDirectionsLoading(false);
      return;
    }

    const controller = new AbortController();
    setDirectionsLoading(true);
    setDirectionsError(null);

    const params = new URLSearchParams({
      originLat: String(origin.latitude),
      originLng: String(origin.longitude),
      destinationLat: String(destination.latitude),
      destinationLng: String(destination.longitude)
    });

    apiFetch<DirectionsResponse>(`/api/directions?${params.toString()}`)
      .then((result) => {
        if (!controller.signal.aborted) setDirections(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setDirections(null);
        setDirectionsError(err instanceof Error ? err.message : "Unable to load street directions");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDirectionsLoading(false);
      });

    return () => controller.abort();
  }, [origin?.latitude, origin?.longitude, destination?.latitude, destination?.longitude]);

  const routeCenter = getRouteCenter(origin, destination);
  const routeGeometry = directions?.points?.length ? directions.points : origin && destination ? [origin, destination] : [];
  const visibleCurrent = currentPosition ?? (latestHistoryPoint ? trackingPointToLocationPoint(latestHistoryPoint) : null);
  const mapCenter = isFollowingUser && visibleCurrent
    ? visibleCurrent
    : manualCenter ?? routeCenter ?? visibleCurrent ?? defaultCenter;
  const routeDistanceMeters = directions?.distanceMeters ?? Number(selectedRoute?.distance_km ?? 0) * 1000;
  const routeDurationSeconds = directions?.durationSeconds ?? Number(selectedRoute?.estimated_minutes ?? 0) * 60;
  const remainingMeters = visibleCurrent && routeGeometry.length > 1
    ? calculateRemainingRouteMeters(visibleCurrent, routeGeometry)
    : routeDistanceMeters;
  const remainingKm = remainingMeters / 1000;
  const etaMinutes = selectedRoute
    ? routeDistanceMeters
      ? Math.max(1, Math.round((remainingMeters / Math.max(routeDistanceMeters, 1)) * (routeDurationSeconds / 60)))
      : selectedRoute.estimated_minutes
    : 0;
  const nearestRouteIndex = visibleCurrent && routeGeometry.length > 1 ? getNearestRouteIndex(visibleCurrent, routeGeometry) : 0;
  const remainingGeometry = visibleCurrent && routeGeometry.length > 1
    ? [visibleCurrent, ...routeGeometry.slice(Math.min(nearestRouteIndex + 1, routeGeometry.length - 1))]
    : routeGeometry;
  const completedGeometry = visibleCurrent && routeGeometry.length > 1
    ? routeGeometry.slice(0, Math.max(1, nearestRouteIndex + 1))
    : [];
  const nextStep = getNextDirectionStep(visibleCurrent, directions?.steps ?? []);
  const arrivalTime = etaMinutes ? new Date(Date.now() + etaMinutes * 60000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--";
  const directionsUrl = selectedRoute && origin && destination
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${destination.latitude}%2C${destination.longitude}`
    : null;

  const content = (
    <LiveTrackingScreen
      routes={routes}
      routeId={routeId}
      onRouteChange={(nextRouteId) => {
        setRouteId(nextRouteId);
        setIsFollowingUser(false);
        setManualCenter(null);
      }}
      route={selectedRoute}
      origin={origin}
      destination={destination}
      routeGeometry={routeGeometry}
      remainingGeometry={remainingGeometry}
      completedGeometry={completedGeometry}
      directionSteps={directions?.steps ?? []}
      nextStep={nextStep}
      directionsLoading={directionsLoading}
      directionsError={directionsError}
      directionsProvider={directions?.provider ?? null}
      currentPosition={visibleCurrent}
      sessionPoints={sessionPoints}
      mapCenter={mapCenter}
      trackingStatus={trackingStatus}
      elapsedSeconds={elapsedSeconds}
      trackedDistanceMeters={trackedDistanceMeters}
      currentSpeedKmh={currentSpeedKmh}
      remainingKm={remainingKm}
      etaMinutes={etaMinutes}
      arrivalTime={arrivalTime}
      isFollowingUser={isFollowingUser}
      saving={saving}
      savingSummary={savingSummary}
      errorMessage={errorMessage}
      notice={notice}
      directionsUrl={directionsUrl}
      onStart={() => beginTracking(true)}
      onResume={() => beginTracking(false)}
      onPause={pauseTracking}
      onEnd={endTracking}
      onRefresh={load}
      onSaveSummary={saveSummaryAsLog}
      onRecenter={() => {
        setManualCenter(null);
        setIsFollowingUser(true);
      }}
      onPanAway={(center) => {
        setManualCenter(center);
        setIsFollowingUser(false);
      }}
      onNotice={setNotice}
    />
  );

  return (
    <ResponsiveShell title="Tracking" subtitle="Track live commute position and save location samples to Supabase." mobile={content} mobileFullScreen>
      {content}
    </ResponsiveShell>
  );
}

function LiveTrackingScreen({
  routes,
  routeId,
  onRouteChange,
  route,
  origin,
  destination,
  routeGeometry,
  remainingGeometry,
  completedGeometry,
  directionSteps,
  nextStep,
  directionsLoading,
  directionsError,
  directionsProvider,
  currentPosition,
  sessionPoints,
  mapCenter,
  trackingStatus,
  elapsedSeconds,
  trackedDistanceMeters,
  currentSpeedKmh,
  remainingKm,
  etaMinutes,
  arrivalTime,
  isFollowingUser,
  saving,
  savingSummary,
  errorMessage,
  notice,
  directionsUrl,
  onStart,
  onResume,
  onPause,
  onEnd,
  onRefresh,
  onSaveSummary,
  onRecenter,
  onPanAway,
  onNotice
}: {
  routes: SavedRoute[];
  routeId: string;
  onRouteChange: (routeId: string) => void;
  route?: SavedRoute;
  origin: MapPoint | null;
  destination: MapPoint | null;
  routeGeometry: MapPoint[];
  remainingGeometry: MapPoint[];
  completedGeometry: MapPoint[];
  directionSteps: DirectionStep[];
  nextStep: DirectionStep | null;
  directionsLoading: boolean;
  directionsError: string | null;
  directionsProvider: string | null;
  currentPosition: LocationPoint | null;
  sessionPoints: LocationPoint[];
  mapCenter: MapPoint;
  trackingStatus: TrackingStatus;
  elapsedSeconds: number;
  trackedDistanceMeters: number;
  currentSpeedKmh: number | null;
  remainingKm: number;
  etaMinutes: number;
  arrivalTime: string;
  isFollowingUser: boolean;
  saving: boolean;
  savingSummary: boolean;
  errorMessage: string | null;
  notice: string | null;
  directionsUrl: string | null;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onEnd: () => void;
  onRefresh: () => void;
  onSaveSummary: () => void;
  onRecenter: () => void;
  onPanAway: (center: MapPoint) => void;
  onNotice: (message: string | null) => void;
}) {
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [layersDimmed, setLayersDimmed] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const sheetDragStartRef = useRef<number | null>(null);
  const sheetDraggedRef = useRef(false);
  const isActive = trackingStatus === "tracking" || trackingStatus === "requesting-permission" || trackingStatus === "paused";
  const isTracking = trackingStatus === "tracking";
  const activelyFollowing = isTracking && isFollowingUser && Boolean(currentPosition);
  const heading = typeof currentPosition?.heading === "number" ? currentPosition.heading : null;
  const topDistance = isTracking ? Math.min(Math.max(remainingKm, 0.1), 0.3).toFixed(1) : etaMinutes ? `${etaMinutes} min` : "--";
  const destinationName = route ? shortPlaceName(route.destination_name) : "destination";
  const instruction = isTracking
    ? nextStep?.instruction ?? `Continue toward ${destinationName}`
    : trackingStatus === "requesting-permission"
      ? "Requesting location..."
      : trackingStatus === "paused"
        ? "Tracking paused"
      : trackingStatus === "ended"
        ? "Commute complete"
        : trackingStatus === "error"
          ? "Location needs attention"
          : route
            ? "Ready to track your commute"
            : "Choose a saved route";

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign("/routes");
    }
  }

  function submitReport(label: string) {
    onNotice(`${label} report saved for this session.`);
    setReportOpen(false);
  }

  function startSheetDrag(event: PointerEvent<HTMLButtonElement>) {
    sheetDragStartRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSheetDrag(event: PointerEvent<HTMLButtonElement>) {
    const startY = sheetDragStartRef.current;
    sheetDragStartRef.current = null;
    if (startY === null) return;

    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) < 18) return;

    sheetDraggedRef.current = true;
    setDetailsCollapsed(deltaY > 0);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071018] text-white lg:min-h-[720px] lg:rounded-[28px] lg:border lg:border-white/[0.08]">
      <LiveTileMap
        center={mapCenter}
        origin={origin}
        destination={destination}
        routeGeometry={routeGeometry}
        remainingGeometry={remainingGeometry}
        completedGeometry={completedGeometry}
        currentPosition={currentPosition}
        sessionPoints={sessionPoints}
        follow={isFollowingUser && Boolean(currentPosition)}
        active={isTracking}
        dimmed={layersDimmed}
        onPanAway={onPanAway}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,5,9,0.38),rgba(3,5,9,0.04)_28%,rgba(3,5,9,0.05)_52%,rgba(3,5,9,0.58))]" />

      <section className="absolute left-3 right-3 top-[calc(env(safe-area-inset-top)+12px)] z-20 rounded-[24px] border border-white/10 bg-[#050608]/92 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl lg:left-5 lg:right-auto lg:w-[520px]">
        <div className="flex items-center gap-3">
          <button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/16 active:scale-95" onClick={goBack} aria-label="Back">
            <ChevronLeft className="size-6" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue text-white", isTracking && "animate-pulse")}>
              <Navigation className="size-6 -rotate-45" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xl font-black leading-none">{topDistance}</p>
              <p className="mt-1 truncate text-sm font-bold text-blue">{instruction}</p>
            </div>
          </div>
          <TrackingStatusPill status={trackingStatus} following={activelyFollowing} />
        </div>
      </section>

      <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+118px)] z-20 grid gap-2 lg:right-5">
        <MapControlButton label={activelyFollowing ? "Following your location" : "Recenter"} active={activelyFollowing} onClick={onRecenter}>
          <Crosshair className="size-5" />
        </MapControlButton>
        <MapControlButton label={voiceGuidance ? "Turn voice guidance off" : "Turn voice guidance on"} active={voiceGuidance} onClick={() => setVoiceGuidance((enabled) => !enabled)}>
          <Volume2 className="size-5" />
        </MapControlButton>
        <MapControlButton label="Report issue" onClick={() => setReportOpen(true)}>
          <AlertTriangle className="size-5" />
        </MapControlButton>
        <MapControlButton label="Toggle map layer shade" active={layersDimmed} onClick={() => setLayersDimmed((enabled) => !enabled)}>
          <Layers className="size-5" />
        </MapControlButton>
      </div>

      {currentPosition ? (
        <div className="absolute bottom-[236px] left-4 z-20 flex size-16 flex-col items-center justify-center rounded-full border-4 border-[#2f363d] bg-[#45515c] text-white shadow-panel lg:bottom-6 lg:left-5">
          <span className="font-heading text-lg font-black leading-none">{currentSpeedKmh ?? 0}</span>
          <span className="text-[10px] font-bold leading-none">km/h</span>
        </div>
      ) : null}

      {reportOpen ? (
        <div className="absolute inset-x-3 bottom-[300px] z-30 rounded-[22px] bg-white p-4 text-[#111318] shadow-[0_18px_44px_rgba(0,0,0,0.22)] lg:bottom-28 lg:left-auto lg:right-5 lg:w-80">
          <div className="flex items-center justify-between gap-3">
            <p className="font-heading text-lg font-black">Report route issue</p>
            <button type="button" className="flex size-8 items-center justify-center rounded-full bg-black/[0.06]" onClick={() => setReportOpen(false)} aria-label="Close reports">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["Traffic", "Flood", "Road work", "Accident", "Crowded", "Checkpoint"].map((label) => (
              <button key={label} type="button" className="rounded-2xl border border-black/10 bg-black/[0.04] px-3 py-3 text-sm font-bold transition hover:bg-black/[0.08]" onClick={() => submitReport(label)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <section className={cn(
        "absolute bottom-0 left-0 right-0 z-20 rounded-t-[28px] border-t border-black/10 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2 text-[#111318] shadow-[0_-16px_34px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out will-change-transform lg:left-auto lg:right-5 lg:bottom-5 lg:w-[430px] lg:rounded-[28px] lg:border lg:border-white/10 lg:pt-4 lg:transition-none",
        detailsCollapsed && "translate-y-[calc(100%-142px)] lg:translate-y-0"
      )}>
        <button
          type="button"
          className="mx-auto mb-2 flex h-7 w-20 items-center justify-center rounded-full lg:hidden"
          onPointerDown={startSheetDrag}
          onPointerUp={finishSheetDrag}
          onClick={() => {
            if (sheetDraggedRef.current) {
              sheetDraggedRef.current = false;
              return;
            }
            setDetailsCollapsed((collapsed) => !collapsed);
          }}
          onPointerCancel={() => {
            sheetDragStartRef.current = null;
          }}
          aria-label={detailsCollapsed ? "Expand commute details" : "Collapse commute details"}
        >
          <span className="h-1.5 w-12 rounded-full bg-black/15" />
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-black/42">{bottomTitle(trackingStatus)}</p>
            <h2 className="mt-1 truncate font-heading text-2xl font-black">{route?.route_name ?? "Live commute"}</h2>
            <p className="mt-1 truncate text-sm font-semibold text-black/48">{route ? route.destination_name : "Choose a route before starting."}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-black/[0.06] px-3 py-2 text-xs font-bold">
            <Radio className={cn("size-4 text-black/42", isTracking && "animate-pulse text-teal")} />
            {isTracking ? isFollowingUser ? "Following" : "Panned" : "Preview"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MetricCell label="ETA" value={etaMinutes ? `${etaMinutes}m` : "--"} />
          <MetricCell label="Arrival" value={arrivalTime} />
          <MetricCell label="Remain" value={remainingKm ? `${remainingKm.toFixed(1)} km` : "--"} />
        </div>
        <div className={cn("mt-2 grid grid-cols-3 gap-2 text-center", detailsCollapsed && "hidden lg:grid")}>
          <MetricCell label="Elapsed" value={formatDuration(elapsedSeconds)} muted />
          <MetricCell label="Tracked" value={formatDistanceMeters(trackedDistanceMeters)} muted />
          <MetricCell label="Accuracy" value={formatAccuracy(currentPosition?.accuracy)} muted />
        </div>

        <div className={cn("mt-4 rounded-2xl bg-black/[0.045] p-3", detailsCollapsed && "hidden lg:block")}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-black/42">Street directions</p>
            <span className="text-[11px] font-bold text-black/42">{directionsProvider ?? "Routing"}</span>
          </div>
          {directionsLoading ? (
            <p className="mt-2 text-sm font-semibold text-black/55">Loading street-by-street route...</p>
          ) : directionsError ? (
            <p className="mt-2 text-sm font-semibold text-red">{directionsError}</p>
          ) : directionSteps.length ? (
            <ol className="mt-2 space-y-2">
              {directionSteps.slice(0, 3).map((step, index) => (
                <li key={`${step.instruction}-${index}`} className="flex gap-2 text-sm leading-5 text-black/68">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue text-[11px] font-black text-white">{index + 1}</span>
                  <span className="min-w-0">
                    <b className="block truncate text-black">{step.instruction}</b>
                    <span className="text-xs font-semibold text-black/42">{formatDistanceMeters(step.distanceMeters)}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm font-semibold text-black/55">Add route coordinates to load road directions.</p>
          )}
        </div>

        <div className={cn("mt-4 grid grid-cols-[1fr_auto_auto] gap-2", detailsCollapsed && "hidden lg:grid")}>
          <select className="h-11 min-w-0 rounded-2xl border border-black/10 bg-black/[0.04] px-3 text-sm font-semibold outline-none" value={routeId} onChange={(event) => onRouteChange(event.target.value)} disabled={isActive}>
            <option value="">No route selected</option>
            {routes.map((item) => <option key={item.id} value={item.id}>{item.route_name}</option>)}
          </select>
          <Button variant="secondary" size="icon" className="border-black/10 bg-black/[0.06] text-[#111318] hover:bg-black/[0.1]" onClick={onRefresh} aria-label="Refresh tracking" disabled={isActive}>
            <Crosshair className="size-4" />
          </Button>
          {directionsUrl ? (
            <Button variant="secondary" size="icon" className="border-black/10 bg-black/[0.06] text-[#111318] hover:bg-black/[0.1]" asChild>
              <a href={directionsUrl} target="_blank" rel="noreferrer" aria-label="Open directions">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>

        <div className={cn("mt-3", detailsCollapsed && "hidden lg:block")}>
          <TrackingAction
            status={trackingStatus}
            savingSummary={savingSummary}
            onStart={onStart}
            onResume={onResume}
            onPause={onPause}
            onEnd={onEnd}
            onSaveSummary={onSaveSummary}
          />
        </div>

        <p className={cn("mt-3 text-xs font-semibold text-black/45", detailsCollapsed && "hidden lg:block")}>
          Your location is only tracked while this commute session is active. ETA uses saved route time scaled by remaining distance.
        </p>
        {heading !== null ? <p className={cn("mt-1 text-xs font-semibold text-black/40", detailsCollapsed && "hidden lg:block")}>Heading {Math.round(heading)} degrees.</p> : null}
        {saving ? <p className={cn("mt-2 text-xs font-bold text-teal", detailsCollapsed && "hidden lg:block")}>Saving latest point...</p> : null}
        {notice ? <p className={cn("mt-2 rounded-2xl bg-black/[0.05] p-2 text-xs font-bold text-black/58", detailsCollapsed && "hidden lg:block")}>{notice}</p> : null}
        {errorMessage ? <p className={cn("mt-2 rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-2 text-xs font-bold text-red", detailsCollapsed && "hidden lg:block")}>{errorMessage}</p> : null}
      </section>
    </div>
  );
}

function LiveTileMap({
  center,
  origin,
  destination,
  routeGeometry,
  remainingGeometry,
  completedGeometry,
  currentPosition,
  sessionPoints,
  follow,
  active,
  dimmed,
  onPanAway
}: {
  center: MapPoint;
  origin: MapPoint | null;
  destination: MapPoint | null;
  routeGeometry: MapPoint[];
  remainingGeometry: MapPoint[];
  completedGeometry: MapPoint[];
  currentPosition: LocationPoint | null;
  sessionPoints: LocationPoint[];
  follow: boolean;
  active: boolean;
  dimmed: boolean;
  onPanAway: (center: MapPoint) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; center: MapPoint } | null>(null);
  const [size, setSize] = useState({ width: 390, height: 720 });
  const defaultZoom = currentPosition ? 15 : origin && destination ? 12 : 11;
  const routeKey = `${origin?.latitude ?? "none"},${origin?.longitude ?? "none"}:${destination?.latitude ?? "none"},${destination?.longitude ?? "none"}`;
  const [zoom, setZoom] = useState(defaultZoom);
  const anchorY = follow ? size.height * 0.58 : size.height / 2;
  const centerPixel = projectPoint(center, zoom);
  const tiles = useMemo(() => getTiles(centerPixel, size, zoom, anchorY), [centerPixel.x, centerPixel.y, size, zoom, anchorY]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        width: Math.max(1, Math.round(entry.contentRect.width)),
        height: Math.max(1, Math.round(entry.contentRect.height))
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setZoom(defaultZoom);
  }, [defaultZoom, routeKey]);

  const toScreen = useCallback((point: MapPoint) => {
    const pixel = projectPoint(point, zoom);
    return {
      x: size.width / 2 + (pixel.x - centerPixel.x),
      y: anchorY + (pixel.y - centerPixel.y)
    };
  }, [anchorY, centerPixel.x, centerPixel.y, size.width, zoom]);

  const routePath = routeGeometry.length > 1 ? buildPath(routeGeometry, toScreen) : origin && destination ? buildPath([origin, destination], toScreen) : "";
  const remainingRoutePath = remainingGeometry.length > 1 ? buildPath(remainingGeometry, toScreen) : "";
  const completedRoutePath = completedGeometry.length > 1 ? buildPath(completedGeometry, toScreen) : "";
  const traveledPath = sessionPoints.length > 1 ? buildPath(sessionPoints, toScreen) : "";
  const originPoint = origin ? toScreen(origin) : null;
  const destinationPoint = destination ? toScreen(destination) : null;
  const userPoint = currentPosition ? toScreen(currentPosition) : null;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, center };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - dragRef.current.x;
    const deltaY = event.clientY - dragRef.current.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) < 2) return;
    const startPixel = projectPoint(dragRef.current.center, zoom);
    onPanAway(unprojectPoint({ x: startPixel.x - deltaX, y: startPixel.y - deltaY }, zoom));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  }

  function adjustZoom(delta: number) {
    setZoom((value) => Math.min(maxMapZoom, Math.max(minMapZoom, value + delta)));
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    adjustZoom(event.deltaY < 0 ? 1 : -1);
  }

  function stopMapDrag(event: PointerEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none cursor-grab select-none overflow-hidden bg-[#17212b] active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      {tiles.map((tile) => (
        <img
          key={`${tile.z}-${tile.x}-${tile.y}`}
          src={`https://tile.openstreetmap.org/${tile.z}/${tile.wrappedX}/${tile.y}.png`}
          alt=""
          draggable={false}
          className={cn("absolute select-none transition duration-300", dimmed && "brightness-[0.55] saturate-[0.7]")}
          style={{ width: tileSize, height: tileSize, left: tile.left, top: tile.top }}
        />
      ))}
      <div className="absolute inset-0 bg-[#071018]/15 mix-blend-multiply" />
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        {routePath ? (
          <>
            <path d={routePath} fill="none" stroke="rgba(4,9,16,0.36)" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
            <path d={routePath} fill="none" stroke="rgba(91,142,240,0.34)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}
        {completedRoutePath ? <path d={completedRoutePath} fill="none" stroke="#22d3b6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {remainingRoutePath ? <path d={remainingRoutePath} fill="none" stroke="#5b8ef0" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {traveledPath ? <path d={traveledPath} fill="none" stroke="#22d3b6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      {originPoint ? <MapLabel point={originPoint} label="Start" tone="blue" /> : null}
      {destinationPoint ? <MapLabel point={destinationPoint} label="End" tone="amber" /> : null}
      {userPoint ? <LiveUserMarker point={userPoint} heading={currentPosition?.heading ?? null} active={active} /> : null}
      <div className="absolute right-3 top-[calc(env(safe-area-inset-top)+318px)] z-20 grid overflow-hidden rounded-2xl border border-black/10 bg-white shadow-panel lg:right-5">
        <button
          type="button"
          className="flex size-11 items-center justify-center text-[#20242a] transition hover:bg-black/[0.05] active:bg-black/[0.08]"
          onClick={() => adjustZoom(1)}
          onPointerDown={stopMapDrag}
          aria-label="Zoom in"
        >
          <Plus className="size-5" />
        </button>
        <span className="h-px bg-black/10" />
        <button
          type="button"
          className="flex size-11 items-center justify-center text-[#20242a] transition hover:bg-black/[0.05] active:bg-black/[0.08]"
          onClick={() => adjustZoom(-1)}
          onPointerDown={stopMapDrag}
          aria-label="Zoom out"
        >
          <Minus className="size-5" />
        </button>
      </div>
    </div>
  );
}

function LiveUserMarker({ point, heading, active }: { point: PixelPoint; heading: number | null; active: boolean }) {
  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: point.x, top: point.y }}>
      {active ? <span className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue/25 animate-ping" /> : null}
      <div className="relative flex size-12 items-center justify-center rounded-full border-4 border-white bg-blue shadow-[0_10px_26px_rgba(16,36,80,0.35)]">
        {typeof heading === "number" ? (
          <Navigation className="size-6 text-white" style={{ transform: `rotate(${heading - 45}deg)` }} />
        ) : (
          <span className="size-4 rounded-full bg-white" />
        )}
      </div>
    </div>
  );
}

function MapLabel({ point, label, tone }: { point: PixelPoint; label: string; tone: "blue" | "amber" }) {
  return (
    <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: point.x, top: point.y }}>
      <div className={cn("flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-xs font-black text-[#111318] shadow-panel", tone === "blue" ? "border-blue/30" : "border-amber/40")}>
        <MapPin className={cn("size-4", tone === "blue" ? "text-blue" : "text-amber")} />
        {label}
      </div>
    </div>
  );
}

function MapControlButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={cn("flex size-11 items-center justify-center rounded-full bg-white text-[#20242a] shadow-panel transition hover:scale-105 active:scale-95", active && "bg-blue text-white")}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function TrackingStatusPill({ status, following }: { status: TrackingStatus; following: boolean }) {
  const label = status === "tracking"
    ? following ? "Following" : "Recenter"
    : status === "requesting-permission"
      ? "GPS"
      : status === "paused"
        ? "Paused"
        : status === "ended"
          ? "Ended"
          : status === "error"
            ? "Error"
            : "Ready";

  return (
    <span className={cn(
      "hidden rounded-full border px-3 py-2 text-xs font-black sm:inline-flex",
      status === "tracking" && "border-[var(--teal-border)] bg-[var(--teal-soft)] text-teal",
      status === "requesting-permission" && "border-[var(--amber-border)] bg-[var(--amber-soft)] text-amber",
      status === "paused" && "border-white/10 bg-white/10 text-white/70",
      status === "ended" && "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue",
      status === "error" && "border-[var(--red-border)] bg-[var(--red-soft)] text-red",
      status === "idle" && "border-white/10 bg-white/10 text-white/70"
    )}>
      {label}
    </span>
  );
}

function MetricCell({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={cn("rounded-2xl px-2 py-3", muted ? "bg-black/[0.045]" : "bg-black/[0.07]")}>
      <p className="font-heading text-base font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-black/42">{label}</p>
    </div>
  );
}

function TrackingAction({
  status,
  savingSummary,
  onStart,
  onResume,
  onPause,
  onEnd,
  onSaveSummary
}: {
  status: TrackingStatus;
  savingSummary: boolean;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onEnd: () => void;
  onSaveSummary: () => void;
}) {
  if (status === "tracking") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" className="border-black/10 bg-black/[0.06] text-[#111318] hover:bg-black/[0.1]" onClick={onPause}>
          <Pause className="size-4" />
          Pause
        </Button>
        <Button className="bg-[#111318] text-white hover:bg-black" onClick={onEnd}>End Commute</Button>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" className="border-black/10 bg-black/[0.06] text-[#111318] hover:bg-black/[0.1]" onClick={onResume}>
          <Play className="size-4" />
          Resume
        </Button>
        <Button className="bg-[#111318] text-white hover:bg-black" onClick={onEnd}>End Commute</Button>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" className="border-black/10 bg-black/[0.06] text-[#111318] hover:bg-black/[0.1]" onClick={onStart}>
          <LocateFixed className="size-4" />
          New Trip
        </Button>
        <Button className="bg-[#111318] text-white hover:bg-black" onClick={onSaveSummary} disabled={savingSummary}>
          <Save className="size-4" />
          {savingSummary ? "Saving..." : "Save as log"}
        </Button>
      </div>
    );
  }

  return (
    <Button className="w-full bg-[#111318] text-white hover:bg-black" onClick={onStart} disabled={status === "requesting-permission"}>
      <LocateFixed className="size-4" />
      {status === "requesting-permission" ? "Requesting location..." : "Start tracking"}
    </Button>
  );
}

async function savePoint(
  point: LocationPoint,
  routeId: string,
  setSaving: (saving: boolean) => void,
  setErrorMessage: (message: string | null) => void
) {
  setSaving(true);
  try {
    await apiFetch<{ point: TrackingPoint }>("/api/tracking", {
      method: "POST",
      body: JSON.stringify({
        route_id: routeId || null,
        latitude: point.latitude,
        longitude: point.longitude,
        accuracy_m: point.accuracy ?? null,
        speed_mps: point.speed ?? null,
        heading_degrees: point.heading ?? null,
        recorded_at: new Date(point.timestamp).toISOString()
      })
    });
  } catch (err) {
    setErrorMessage(err instanceof Error ? err.message : "Unable to save location");
  } finally {
    setSaving(false);
  }
}

function toLocationPoint(position: GeolocationPosition): LocationPoint {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed,
    heading: position.coords.heading,
    timestamp: position.timestamp
  };
}

function trackingPointToLocationPoint(point: TrackingPoint): LocationPoint {
  return {
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    accuracy: point.accuracy_m,
    speed: point.speed_mps,
    heading: point.heading_degrees,
    timestamp: new Date(point.recorded_at).getTime()
  };
}

function getSpeedKmh(current: LocationPoint | null, points: LocationPoint[]) {
  if (current?.speed !== null && current?.speed !== undefined) return Math.max(0, Math.round(current.speed * 3.6));
  if (points.length < 2) return null;

  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  if (!latest || !previous) return null;
  const elapsedSeconds = Math.max(1, (latest.timestamp - previous.timestamp) / 1000);
  const metersPerSecond = calculateDistanceMeters(previous, latest) / elapsedSeconds;
  return Math.max(0, Math.round(metersPerSecond * 3.6));
}

function getGeoErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location permission was denied. Enable location access in your browser settings to use live commute tracking.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your location is currently unavailable. Try again outside or check your device location settings.";
  }
  if (error.code === error.TIMEOUT) {
    return "Location request timed out. Try again with a stronger GPS or network signal.";
  }
  return error.message || "Unable to read your current location.";
}

function getRouteCenter(origin: MapPoint | null, destination: MapPoint | null) {
  if (!origin || !destination) return null;
  return {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2
  };
}

function getNearestRouteIndex(point: MapPoint, routeGeometry: MapPoint[]) {
  return routeGeometry.reduce((nearestIndex, routePoint, index) => {
    const nearestDistance = calculateDistanceMeters(point, routeGeometry[nearestIndex]);
    const candidateDistance = calculateDistanceMeters(point, routePoint);
    return candidateDistance < nearestDistance ? index : nearestIndex;
  }, 0);
}

function calculateRemainingRouteMeters(point: MapPoint, routeGeometry: MapPoint[]) {
  if (routeGeometry.length < 2) return 0;
  const nearestIndex = getNearestRouteIndex(point, routeGeometry);
  const remainingPoints = [point, ...routeGeometry.slice(Math.min(nearestIndex + 1, routeGeometry.length - 1))];
  return calculatePathDistanceMeters(remainingPoints);
}

function calculatePathDistanceMeters(points: MapPoint[]) {
  return points.reduce((total, point, index) => {
    const previous = points[index - 1];
    return previous ? total + calculateDistanceMeters(previous, point) : total;
  }, 0);
}

function getNextDirectionStep(current: MapPoint | null, steps: DirectionStep[]) {
  if (!steps.length) return null;
  if (!current) return steps[0];

  const upcoming = steps.find((step) => {
    if (!step.location || step.type === "depart") return false;
    return calculateDistanceMeters(current, step.location) > 35;
  });

  return upcoming ?? steps[steps.length - 1] ?? null;
}

function projectPoint(point: MapPoint, zoom: number): PixelPoint {
  const scale = tileSize * 2 ** zoom;
  const sinLatitude = Math.sin((point.latitude * Math.PI) / 180);
  return {
    x: ((point.longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * scale
  };
}

function unprojectPoint(point: PixelPoint, zoom: number): MapPoint {
  const scale = tileSize * 2 ** zoom;
  const longitude = (point.x / scale) * 360 - 180;
  const normalized = 0.5 - point.y / scale;
  const latitude = 90 - (360 * Math.atan(Math.exp(-normalized * 2 * Math.PI))) / Math.PI;
  return { latitude, longitude };
}

function getTiles(centerPixel: PixelPoint, size: { width: number; height: number }, zoom: number, anchorY: number) {
  const maxTile = 2 ** zoom;
  const startX = Math.floor((centerPixel.x - size.width / 2) / tileSize) - 1;
  const endX = Math.ceil((centerPixel.x + size.width / 2) / tileSize) + 1;
  const startY = Math.floor((centerPixel.y - anchorY) / tileSize) - 1;
  const endY = Math.ceil((centerPixel.y + (size.height - anchorY)) / tileSize) + 1;
  const tiles = [];

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      tiles.push({
        x,
        y,
        z: zoom,
        wrappedX: ((x % maxTile) + maxTile) % maxTile,
        left: size.width / 2 + (x * tileSize - centerPixel.x),
        top: anchorY + (y * tileSize - centerPixel.y)
      });
    }
  }

  return tiles;
}

function buildPath(points: MapPoint[], toScreen: (point: MapPoint) => PixelPoint) {
  return points
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .map((point, index) => {
      const screenPoint = toScreen(point);
      return `${index === 0 ? "M" : "L"} ${screenPoint.x.toFixed(1)} ${screenPoint.y.toFixed(1)}`;
    })
    .join(" ");
}

function bottomTitle(status: TrackingStatus) {
  if (status === "requesting-permission") return "Requesting location";
  if (status === "tracking") return "Tracking your commute";
  if (status === "paused") return "Tracking paused";
  if (status === "ended") return "Commute complete";
  if (status === "error") return "Location needs attention";
  return "Ready to track";
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function formatDistanceMeters(meters: number) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatAccuracy(accuracy?: number | null) {
  if (typeof accuracy !== "number") return "--";
  return `${Math.round(accuracy)}m`;
}

function shortPlaceName(value: string) {
  return value.split(",")[0]?.trim() || value;
}
