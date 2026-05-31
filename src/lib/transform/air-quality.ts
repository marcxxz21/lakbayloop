import type { AirQualitySnapshot } from "@/lib/api/air-quality";

export function transformAirQuality(snapshot: AirQualitySnapshot) {
  return {
    route_id: snapshot.routeId,
    aqi: snapshot.aqi,
    label: snapshot.label,
    observed_at: snapshot.observedAt
  };
}
