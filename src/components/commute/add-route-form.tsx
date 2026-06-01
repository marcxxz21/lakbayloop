"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { preferredModes } from "@/lib/constants";
import type { PreferredMode, SavedRoute } from "@/lib/types";
import { cn } from "@/lib/utils";

type FormState = {
  route_name: string;
  origin_name: string;
  destination_name: string;
  is_favorite: boolean;
};

export type AddressResult = {
  id: string;
  label: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
};

const defaultState: FormState = {
  route_name: "",
  origin_name: "",
  destination_name: "",
  is_favorite: false
};

export function AddRouteForm({ onSaved }: { onSaved?: (route: SavedRoute) => void }) {
  const [open, setOpen] = useState(false);
  const [modes, setModes] = useState<PreferredMode[]>(["Walking"]);
  const [form, setForm] = useState<FormState>(defaultState);
  const [origin, setOrigin] = useState<AddressResult | null>(null);
  const [destination, setDestination] = useState<AddressResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        origin_name: origin?.label ?? form.origin_name,
        origin_lat: origin?.latitude ?? null,
        origin_lng: origin?.longitude ?? null,
        destination_name: destination?.label ?? form.destination_name,
        destination_lat: destination?.latitude ?? null,
        destination_lng: destination?.longitude ?? null,
        preferred_mode: modes[0],
        preferred_modes: modes
      };
      const result = await apiFetch<{ route: SavedRoute }>("/api/routes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onSaved?.(result.route);
      setForm(defaultState);
      setOrigin(null);
      setDestination(null);
      setModes(["Walking"]);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save route");
    } finally {
      setSaving(false);
    }
  }

  const mapSrc = useMemo(() => {
    const point = destination ?? origin;
    if (!point) return "";

    const pad = 0.012;
    const base = process.env.NEXT_PUBLIC_OSM_EMBED_BASE ?? "https://www.openstreetmap.org/export/embed.html";
    const params = new URLSearchParams({
      bbox: `${point.longitude - pad},${point.latitude - pad},${point.longitude + pad},${point.latitude + pad}`,
      layer: "mapnik",
      marker: `${point.latitude},${point.longitude}`
    });
    return `${base}?${params.toString()}`;
  }, [origin, destination]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add route
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-bg/85 backdrop-blur-md lg:items-center lg:justify-center">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel lg:max-w-3xl lg:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-xl font-black">Add saved route</h2>
              <button type="button" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Route name</Label>
                <Input
                  className="mt-2"
                  required
                  value={form.route_name}
                  onChange={(event) => setForm((current) => ({ ...current, route_name: event.target.value }))}
                  placeholder="Home to work"
                />
              </div>

              <AddressSearch
                label="Start point"
                value={form.origin_name}
                selected={origin}
                onValueChange={(value) => {
                  setForm((current) => ({ ...current, origin_name: value }));
                  setOrigin(null);
                }}
                onSelect={(result) => {
                  setOrigin(result);
                  setForm((current) => ({ ...current, origin_name: result.name }));
                }}
              />

              <AddressSearch
                label="End point"
                value={form.destination_name}
                selected={destination}
                onValueChange={(value) => {
                  setForm((current) => ({ ...current, destination_name: value }));
                  setDestination(null);
                }}
                onSelect={(result) => {
                  setDestination(result);
                  setForm((current) => ({ ...current, destination_name: result.name }));
                }}
              />

              <div className="overflow-hidden rounded-[20px] border border-white/[0.08] bg-bg md:col-span-2">
                {mapSrc ? (
                  <iframe title="Route address preview" src={mapSrc} className="h-56 w-full border-0" loading="lazy" />
                ) : (
                  <div className="flex h-56 items-center justify-center px-6 text-center text-sm text-white/40">
                    Search and choose a start or end point to preview it on the map.
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>Preferred modes</Label>
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
              <label className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 md:col-span-2">
                <span>
                  <span className="block font-heading font-bold">Favorite route</span>
                  <span className="text-sm text-white/38">Pin this route to the dashboard.</span>
                </span>
                <input
                  type="checkbox"
                  className="size-5 accent-blue"
                  checked={form.is_favorite}
                  onChange={(event) => setForm((current) => ({ ...current, is_favorite: event.target.checked }))}
                />
              </label>
            </div>
            {error ? <p className="mt-4 rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
            <Button className="mt-5 w-full" disabled={saving || !origin || !destination}>{saving ? "Saving..." : "Save Route"}</Button>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function AddressSearch({
  label,
  value,
  selected,
  onValueChange,
  onSelect
}: {
  label: string;
  value: string;
  selected: AddressResult | null;
  onValueChange: (value: string) => void;
  onSelect: (result: AddressResult) => void;
}) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected || value.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const payload = await response.json();
        setResults(payload.results ?? []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [selected, value]);

  return (
    <div className="relative">
      <Label>{label}</Label>
      <div className="relative mt-2">
        <Input required value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="Search address or landmark" />
        {loading ? <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/35" /> : null}
      </div>
      {selected ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-teal">
          <MapPin className="size-3.5" />
          {selected.label}
        </p>
      ) : null}
      {results.length ? (
        <div className="absolute left-0 right-0 top-full z-[90] mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111419] shadow-panel">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              className="block w-full border-b border-white/[0.05] px-4 py-3 text-left last:border-0 hover:bg-white/[0.05]"
              onClick={() => onSelect(result)}
            >
              <span className="block truncate text-sm font-semibold text-white">{result.name}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-white/45">{result.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function toggleMode(current: PreferredMode[], mode: PreferredMode): PreferredMode[] {
  if (mode === "Mixed") return ["Mixed"];
  const withoutMixed = current.filter((item) => item !== "Mixed");

  if (current.includes(mode)) {
    return withoutMixed.length === 1 ? current : withoutMixed.filter((item) => item !== mode);
  }
  return [...withoutMixed, mode];
}
