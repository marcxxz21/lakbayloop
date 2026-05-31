export type AirQualitySnapshot = {
  routeId: string;
  aqi: number;
  label: "Good" | "Moderate" | "Poor";
  observedAt: string;
};

export async function fetchAirQualityForRoute(routeId: string): Promise<AirQualitySnapshot> {
  return {
    routeId,
    aqi: 64,
    label: "Moderate",
    observedAt: new Date().toISOString()
  };
}
