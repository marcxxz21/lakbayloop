import { Sparkles } from "lucide-react";
import { DarkCard } from "@/components/ui-custom/dark-card";

export function CommuteTipCard() {
  return (
    <DarkCard className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-[14px] border border-[var(--teal-border)] bg-[var(--teal-soft)] text-teal">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h3 className="font-heading text-base font-black">Commute tip</h3>
          <p className="text-xs text-white/38">Based on weather, air, and recent logs</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/65">
        Leave 12 minutes earlier on Jeepney days. Your logs show crowding spikes after 7:45 AM, especially when rain chance is above 35%.
      </p>
    </DarkCard>
  );
}
