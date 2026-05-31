export type RouteSnapshot = {
  routeId: string;
  distanceKm: number;
  estimatedMinutes: number;
  observedAt: string;
};

export async function fetchRouteSnapshot(routeId: string): Promise<RouteSnapshot> {
  return {
    routeId,
    distanceKm: 3.2,
    estimatedMinutes: 28,
    observedAt: new Date().toISOString()
  };
}
