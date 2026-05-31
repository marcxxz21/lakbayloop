import { Clock, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { cn } from "@/lib/utils";
import type { mockRoutes } from "@/lib/mock-data";

type RouteItem = (typeof mockRoutes)[number];

export function RouteCard({ route, compact = false }: { route: RouteItem; compact?: boolean }) {
  const Icon = route.icon;

  return (
    <div className={cn("rounded-[20px] border border-white/[0.055] bg-surface p-4 transition hover:border-white/10 hover:bg-surface-soft", compact ? "space-y-3" : "space-y-4")}>
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-base font-black text-white">{route.routeName}</h3>
            {route.isFavorite ? <Heart className="size-4 fill-blue text-blue" /> : null}
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/42">
            <MapPin className="size-3.5" />
            {route.mode} · {route.distanceKm} km · last log {route.latestLog}
          </p>
        </div>
        <StatusBadge status={route.condition} />
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-white/[0.035] px-3 py-2">
        <span className="flex items-center gap-2 text-xs text-white/45">
          <Clock className="size-4 text-amber" />
          Estimated
        </span>
        <span className="font-heading text-lg font-black text-white">{route.estimatedMinutes} min</span>
      </div>
      {!compact ? (
        <div className="flex gap-2">
          <Button variant="teal" size="sm" className="flex-1">Log Ride</Button>
          <Button variant="secondary" size="sm" className="flex-1">Details</Button>
        </div>
      ) : null}
    </div>
  );
}
