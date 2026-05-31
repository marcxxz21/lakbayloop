import { Bike, Bus, Car, Clock, Footprints, Heart, MapPin, TrainFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { cn } from "@/lib/utils";
import type { PreferredMode, SavedRoute } from "@/lib/types";

const modeIcons = {
  Walking: Footprints,
  Jeepney: Bus,
  Bus,
  Train: TrainFront,
  Bike,
  Car,
  Mixed: MapPin
};

export function RouteCard({
  route,
  compact = false,
  onLog,
  onSelect,
  onToggleFavorite
}: {
  route: SavedRoute;
  compact?: boolean;
  onLog?: (route: SavedRoute) => void;
  onSelect?: (route: SavedRoute) => void;
  onToggleFavorite?: (route: SavedRoute) => void;
}) {
  const Icon = modeIcons[route.preferred_mode as PreferredMode] ?? MapPin;
  const condition = route.condition ?? (route.is_favorite ? "Good" : "Moderate");

  return (
    <div className={cn("rounded-[20px] border border-white/[0.055] bg-surface p-4 transition hover:border-white/10 hover:bg-surface-soft", compact ? "space-y-3" : "space-y-4")}>
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-base font-black text-white">{route.route_name}</h3>
            <button type="button" onClick={() => onToggleFavorite?.(route)} aria-label="Toggle favorite">
              <Heart className={cn("size-4 text-white/24", route.is_favorite && "fill-blue text-blue")} />
            </button>
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/42">
            <MapPin className="size-3.5" />
            {route.origin_name} &gt; {route.destination_name}
          </p>
          <p className="mt-1 truncate text-xs text-white/32">
            {route.preferred_mode} · {route.distance_km} km · last log {route.latest_log ?? "No logs yet"}
          </p>
        </div>
        <StatusBadge status={condition} />
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-3 py-2">
        <span className="flex items-center gap-2 text-xs text-white/45">
          <Clock className="size-4 text-amber" />
          Estimated
        </span>
        <span className="font-heading text-lg font-black text-white">{route.estimated_minutes} min</span>
      </div>
      {!compact ? (
        <div className="flex gap-2">
          <Button variant="teal" size="sm" className="flex-1" onClick={() => onLog?.(route)}>Log Ride</Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => onSelect?.(route)}>Details</Button>
        </div>
      ) : null}
    </div>
  );
}
