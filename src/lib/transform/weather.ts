import type { WeatherSnapshot } from "@/lib/api/weather";

export function transformWeather(snapshot: WeatherSnapshot) {
  return {
    route_id: snapshot.routeId,
    rain_chance: snapshot.rainChance,
    temperature_c: snapshot.temperatureC,
    observed_at: snapshot.observedAt
  };
}
