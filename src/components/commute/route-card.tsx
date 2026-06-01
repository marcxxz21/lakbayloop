import { Bike, Bus, Car, Clock, Footprints, Heart, MapPin, TrainFront, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { formatModes } from "@/lib/commute-calculations";
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
  active = false,
  compact = false,
  onLog,
  onSelect,
  onToggleFavorite,
  onDelete,
  deleting = false
}: {
  route: SavedRoute;
  active?: boolean;
  compact?: boolean;
  onLog?: (route: SavedRoute) => void;
  onSelect?: (route: SavedRoute) => void;
  onToggleFavorite?: (route: SavedRoute) => void;
  onDelete?: (route: SavedRoute) => void;
  deleting?: boolean;
}) {
  const Icon = modeIcons[route.preferred_mode as PreferredMode] ?? MapPin;
  const condition = route.condition ?? (route.is_favorite ? "Good" : "Moderate");

  return (
    <div className={cn(
      "min-w-0 rounded-[20px] border border-white/[0.055] bg-surface p-4 transition duration-200 hover:border-white/10 hover:bg-surface-soft",
      active && "border-[var(--blue-border)] bg-[var(--blue-soft)] shadow-[0_0_0_1px_rgba(91,142,240,0.16)]",
      compact ? "space-y-3" : "space-y-4"
    )}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-heading text-base font-black text-white">{route.route_name}</h3>
            <button
              type="button"
              onClick={() => onToggleFavorite?.(route)}
              aria-label={route.is_favorite ? "Remove favorite" : "Add favorite"}
              aria-pressed={route.is_favorite}
              className="group flex size-8 shrink-0 items-center justify-center rounded-full transition duration-200 hover:scale-105 hover:bg-white/[0.06] active:scale-95"
            >
              <Heart
                className={cn(
                  "size-4 text-white/24 transition-all duration-300 ease-out group-hover:scale-110",
                  route.is_favorite && "scale-110 fill-blue text-blue drop-shadow-[0_0_10px_rgba(91,142,240,0.55)]"
                )}
              />
            </button>
          </div>
          <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-white/42">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{route.origin_name} &gt; {route.destination_name}</span>
          </p>
          <p className="mt-1 truncate text-xs text-white/32">
            {formatModes(route.preferred_modes, route.preferred_mode)} · {route.distance_km} km · last log {route.latest_log ?? "No logs yet"}
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
          {onDelete ? (
            <Button
              variant="danger"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onDelete(route)}
              disabled={deleting}
              aria-label={`Delete ${route.route_name}`}
              title="Delete route"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
