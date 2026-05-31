"use client";

import { FormEvent, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { crowdLevels } from "@/lib/constants";
import type { CrowdLevel, RouteLog, SavedRoute } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RouteLogForm({
  buttonLabel = "Open log form",
  routes = [],
  selectedRouteId,
  onSaved
}: {
  buttonLabel?: string;
  routes?: SavedRoute[];
  selectedRouteId?: string;
  onSaved?: (log: RouteLog) => void;
}) {
  const [open, setOpen] = useState(false);
  const [routeId, setRouteId] = useState(selectedRouteId ?? "");
  const [travelDate, setTravelDate] = useState(new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState("");
  const [crowd, setCrowd] = useState<CrowdLevel>("moderate");
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableRoutes = useMemo(() => routes, [routes]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const result = await apiFetch<{ log: RouteLog }>("/api/logs", {
        method: "POST",
        body: JSON.stringify({
          route_id: routeId || availableRoutes[0]?.id,
          travel_date: travelDate,
          actual_duration_minutes: Number(minutes),
          crowd_level: crowd,
          rating,
          notes
        })
      });
      onSaved?.(result.log);
      setOpen(false);
      setMinutes("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => {
        setRouteId(selectedRouteId ?? routes[0]?.id ?? "");
        setOpen(true);
      }}>{buttonLabel}</Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-bg/85 backdrop-blur-md lg:items-center lg:justify-center">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel lg:max-w-xl lg:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Commute log</p>
                <h2 className="font-heading text-xl font-black">How was the ride?</h2>
              </div>
              <button className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Saved route</Label>
                <select
                  className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-surface-soft px-4 text-sm text-white outline-none"
                  value={routeId || availableRoutes[0]?.id || ""}
                  onChange={(event) => setRouteId(event.target.value)}
                  required
                >
                  {availableRoutes.map((route) => <option key={route.id} value={route.id}>{route.route_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <Button className="w-full" disabled={saving || !availableRoutes.length}>{saving ? "Saving..." : "Save Log"}</Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
