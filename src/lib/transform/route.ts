import type { RouteSnapshot } from "@/lib/api/osrm";

export function transformRoute(snapshot: RouteSnapshot) {
  return {
    route_id: snapshot.routeId,
    distance_km: snapshot.distanceKm,
    estimated_minutes: snapshot.estimatedMinutes,
    observed_at: snapshot.observedAt
  };
}
