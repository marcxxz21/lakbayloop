"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { AddressSearch, toggleMode, type AddressResult } from "@/components/commute/add-route-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { crowdLevels, preferredModes } from "@/lib/constants";
import type { CrowdLevel, PreferredMode, RouteLog, SavedRoute } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RouteLogForm({
  buttonLabel = "Open log form",
  routes = [],
  selectedRouteId,
  onSaved,
  openSignal,
  hideTrigger = false
}: {
  buttonLabel?: string;
  routes?: SavedRoute[];
  selectedRouteId?: string;
  onSaved?: (log: RouteLog) => void;
  openSignal?: string | number;
  hideTrigger?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [routeSource, setRouteSource] = useState<"saved" | "new">("saved");
  const [routeId, setRouteId] = useState(selectedRouteId ?? "");
  const [newRouteName, setNewRouteName] = useState("");
  const [newOriginName, setNewOriginName] = useState("");
  const [newDestinationName, setNewDestinationName] = useState("");
  const [newOrigin, setNewOrigin] = useState<AddressResult | null>(null);
  const [newDestination, setNewDestination] = useState<AddressResult | null>(null);
  const [modes, setModes] = useState<PreferredMode[]>(["Mixed"]);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState("");
  const [crowd, setCrowd] = useState<CrowdLevel>("moderate");
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableRoutes = useMemo(() => routes, [routes]);
  const selectedRoute = availableRoutes.find((route) => route.id === routeId) ?? availableRoutes[0];
  const canSaveNewRoute = newRouteName.trim().length >= 2 && newOriginName.trim().length >= 3 && newDestinationName.trim().length >= 3;

  useEffect(() => {
    if (openSignal === undefined) return;
    const nextRouteId = selectedRouteId ?? routes[0]?.id ?? "";
    setRouteSource(nextRouteId ? "saved" : "new");
    setRouteId(nextRouteId);
    const route = routes.find((item) => item.id === nextRouteId) ?? routes[0];
    setModes(route?.preferred_modes?.length ? route.preferred_modes : route?.preferred_mode ? [route.preferred_mode] : ["Mixed"]);
    setOpen(true);
  }, [openSignal, routes, selectedRouteId]);

  useEffect(() => {
    if (!open || routeSource !== "saved") return;
    setModes(selectedRoute?.preferred_modes?.length ? selectedRoute.preferred_modes : selectedRoute?.preferred_mode ? [selectedRoute.preferred_mode] : ["Mixed"]);
  }, [open, routeSource, selectedRoute]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let activeRouteId = routeId || availableRoutes[0]?.id || "";
      if (routeSource === "new") {
        const routeResult = await apiFetch<{ route: SavedRoute }>("/api/routes", {
          method: "POST",
          body: JSON.stringify({
            route_name: newRouteName,
            origin_name: newOrigin?.label ?? newOriginName,
            origin_lat: newOrigin?.latitude ?? null,
            origin_lng: newOrigin?.longitude ?? null,
            destination_name: newDestination?.label ?? newDestinationName,
            destination_lat: newDestination?.latitude ?? null,
            destination_lng: newDestination?.longitude ?? null,
            preferred_mode: modes[0],
            preferred_modes: modes,
            is_favorite: false
          })
        });
        activeRouteId = routeResult.route.id;
      }

      const result = await apiFetch<{ log: RouteLog }>("/api/logs", {
        method: "POST",
        body: JSON.stringify({
          route_id: activeRouteId,
          travel_date: travelDate,
          actual_duration_minutes: Number(minutes),
          crowd_level: crowd,
          rating,
          preferred_modes: modes,
          notes
        })
      });
      onSaved?.(result.log);
      setOpen(false);
      setMinutes("");
      setNotes("");
      setNewRouteName("");
      setNewOriginName("");
      setNewDestinationName("");
      setNewOrigin(null);
      setNewDestination(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {hideTrigger ? null : (
        <Button onClick={() => {
          setRouteId(selectedRouteId ?? routes[0]?.id ?? "");
          setRouteSource((selectedRouteId ?? routes[0]?.id) ? "saved" : "new");
          setOpen(true);
        }}>{buttonLabel}</Button>
      )}
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-bg/85 backdrop-blur-md lg:items-center lg:justify-center">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel lg:max-w-xl lg:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Commute log</p>
                <h2 className="font-heading text-xl font-black">How was the ride?</h2>
              </div>
              <button type="button" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Route</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.035] p-1">
                  {(["saved", "new"] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      className={cn("rounded-xl px-3 py-2 text-sm font-bold text-white/45 transition", routeSource === source && "bg-white text-bg")}
                      onClick={() => setRouteSource(source)}
                    >
                      {source === "saved" ? "Use saved" : "Create new"}
                    </button>
                  ))}
                </div>
              </div>
              {routeSource === "saved" ? (
                <div>
                  <Label>Saved route</Label>
                  <select
                    className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-surface-soft px-4 text-sm text-white outline-none"
                    value={routeId || availableRoutes[0]?.id || ""}
                    onChange={(event) => setRouteId(event.target.value)}
                    required={routeSource === "saved"}
                  >
                    {availableRoutes.map((route) => <option key={route.id} value={route.id}>{route.route_name}</option>)}
                  </select>
                  {!availableRoutes.length ? <p className="mt-2 text-xs text-white/42">No saved routes yet. Create one from this log.</p> : null}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>New route name</Label>
                    <Input className="mt-2" value={newRouteName} onChange={(event) => setNewRouteName(event.target.value)} placeholder="Morning commute" required={routeSource === "new"} />
                  </div>
                  <AddressSearch
                    label="Start point"
                    value={newOriginName}
                    selected={newOrigin}
                    onValueChange={(value) => {
                      setNewOriginName(value);
                      setNewOrigin(null);
                    }}
                    onSelect={(result) => {
                      setNewOrigin(result);
                      setNewOriginName(result.name);
                    }}
                  />
                  <AddressSearch
                    label="End point"
                    value={newDestinationName}
                    selected={newDestination}
                    onValueChange={(value) => {
                      setNewDestinationName(value);
                      setNewDestination(null);
                    }}
                    onSelect={(result) => {
                      setNewDestination(result);
                      setNewDestinationName(result.name);
                    }}
                  />
                  <p className="text-xs leading-5 text-white/42 md:col-span-2">
                    Search and choose a result for best accuracy. You can still save typed addresses and Kalakbay will try to locate them.
                  </p>
                </div>
              )}
              <div>
                <Label>Modes used</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferredModes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setModes((current) => toggleMode(current, item as PreferredMode))}
                      className={cn("rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/45", modes.includes(item as PreferredMode) && "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue")}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Travel date</Label>
                  <Input className="mt-2" type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} required />
                </div>
                <div>
                  <Label>Actual minutes</Label>
                  <Input className="mt-2" type="number" placeholder="34" value={minutes} onChange={(event) => setMinutes(event.target.value)} required min={1} max={300} />
                </div>
              </div>
              <div>
                <Label>Crowd level</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {crowdLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCrowd(level as CrowdLevel)}
                      className={cn("rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/45", crowd === level && "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue")}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Experience rating</Label>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star`}>
                      <Star className={cn("size-7 text-amber", value <= rating ? "fill-amber" : "fill-transparent opacity-30")} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea className="mt-2" placeholder="Rain, crowding, delays, transfer notes..." value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
              {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
              <Button className="w-full" disabled={saving || (routeSource === "saved" && !availableRoutes.length) || (routeSource === "new" && !canSaveNewRoute)}>{saving ? "Saving..." : "Save Log"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
