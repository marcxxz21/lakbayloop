"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crowdLevels } from "@/lib/constants";
import { mockRoutes } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function RouteLogForm({ buttonLabel = "Open log form" }: { buttonLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [crowd, setCrowd] = useState("moderate");
  const [rating, setRating] = useState(4);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{buttonLabel}</Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-bg/85 backdrop-blur-md lg:items-center lg:justify-center">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel lg:max-w-xl lg:rounded-[28px]">
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
                <select className="mt-2 h-12 w-full rounded-2xl border border-white/[0.08] bg-surface-soft px-4 text-sm text-white outline-none">
                  {mockRoutes.map((route) => <option key={route.id}>{route.routeName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Travel date</Label>
                  <Input className="mt-2" type="date" />
                </div>
                <div>
                  <Label>Actual minutes</Label>
                  <Input className="mt-2" type="number" placeholder="34" />
                </div>
              </div>
              <div>
                <Label>Crowd level</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {crowdLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCrowd(level)}
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
                <Textarea className="mt-2" placeholder="Rain, crowding, delays, transfer notes..." />
              </div>
              <Button className="w-full" onClick={() => setOpen(false)}>Save Log</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
