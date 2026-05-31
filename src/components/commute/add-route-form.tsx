"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preferredModes } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AddRouteForm() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("Walking");

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add route
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-bg/85 backdrop-blur-md lg:items-center lg:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel lg:max-w-2xl lg:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-xl font-black">Add saved route</h2>
              <button className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {["Route name", "Origin name", "Origin latitude", "Origin longitude", "Destination name", "Destination latitude", "Destination longitude"].map((field) => (
                <div key={field}>
                  <Label>{field}</Label>
                  <Input className="mt-2" placeholder={field} />
                </div>
              ))}
              <div className="md:col-span-2">
                <Label>Preferred mode</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferredModes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
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
                <input type="checkbox" className="size-5 accent-blue" />
              </label>
            </div>
            <Button className="mt-5 w-full" onClick={() => setOpen(false)}>Save Route</Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
