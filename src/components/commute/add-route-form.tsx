"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
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
  origin_lat: string;
  origin_lng: string;
  destination_name: string;
  destination_lat: string;
  destination_lng: string;
  is_favorite: boolean;
};

const defaultState: FormState = {
  route_name: "",
  origin_name: "",
  origin_lat: "",
  origin_lng: "",
  destination_name: "",
  destination_lat: "",
  destination_lng: "",
  is_favorite: false
};

export function AddRouteForm({ onSaved }: { onSaved?: (route: SavedRoute) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PreferredMode>("Walking");
  const [form, setForm] = useState<FormState>(defaultState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...form,
        origin_lat: form.origin_lat ? Number(form.origin_lat) : null,
        origin_lng: form.origin_lng ? Number(form.origin_lng) : null,
        destination_lat: form.destination_lat ? Number(form.destination_lat) : null,
        destination_lng: form.destination_lng ? Number(form.destination_lng) : null,
        preferred_mode: mode
      };
      const result = await apiFetch<{ route: SavedRoute }>("/api/routes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      onSaved?.(result.route);
      setForm(defaultState);
      setMode("Walking");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save route");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add route
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-bg/85 backdrop-blur-md lg:items-center lg:justify-center">
          <form onSubmit={handleSubmit} className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel lg:max-w-2xl lg:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-xl font-black">Add saved route</h2>
              <button className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["route_name", "Route name"],
                ["origin_name", "Origin name"],
                ["origin_lat", "Origin latitude"],
                ["origin_lng", "Origin longitude"],
                ["destination_name", "Destination name"],
                ["destination_lat", "Destination latitude"],
                ["destination_lng", "Destination longitude"]
              ].map(([name, label]) => (
                <div key={name}>
                  <Label>{label}</Label>
                  <Input
                    className="mt-2"
                    required={name === "route_name" || name === "origin_name" || name === "destination_name"}
                    inputMode={name.includes("lat") || name.includes("lng") ? "decimal" : undefined}
                    value={form[name as keyof FormState] as string}
                    onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                    placeholder={label}
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <Label>Preferred mode</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferredModes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item as PreferredMode)}
                      className={cn("rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/45", mode === item && "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue")}
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
            <Button className="mt-5 w-full" disabled={saving}>{saving ? "Saving..." : "Save Route"}</Button>
          </form>
        </div>
      ) : null}
    </>
  );
}
