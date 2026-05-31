import { CloudRain, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { commuteContext } from "@/lib/mock-data";

export function CommuteContextCard() {
  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className="absolute -right-10 -top-12 size-36 rounded-full bg-blue/10 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/38">Today&apos;s commute</p>
          <h2 className="mt-2 font-heading text-2xl font-black text-white">{commuteContext.route}</h2>
          <p className="mt-1 text-sm text-white/55">{commuteContext.via}</p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--amber-border)] bg-[var(--amber-soft)] text-amber">
          <CloudRain className="size-6" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-[11px] text-white/35">Estimated</p>
          <p className="mt-1 font-heading text-lg font-black">{commuteContext.estimated}</p>
        </div>
        <div className="rounded-2xl bg-[var(--amber-soft)] p-3">
          <p className="text-[11px] text-white/35">Rain</p>
          <p className="mt-1 font-heading text-lg font-black text-amber">{commuteContext.rainChance}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <p className="text-[11px] text-white/35">AQI</p>
          <p className="mt-1 font-heading text-lg font-black">{commuteContext.airQuality}</p>
        </div>
      </div>
      <p className="mt-4 rounded-2xl border border-[var(--blue-border)] bg-[var(--blue-soft)] p-3 text-sm leading-6 text-white/72">
        {commuteContext.tip}
      </p>
      <div className="mt-4 flex gap-2">
        <Button className="flex-1">
          <Navigation className="size-4" />
          Log ride
        </Button>
        <Button variant="secondary" className="flex-1">View route</Button>
      </div>
    </GlassCard>
  );
}
