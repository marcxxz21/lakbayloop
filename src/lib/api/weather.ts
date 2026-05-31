export type WeatherSnapshot = {
  routeId: string;
  rainChance: number;
  temperatureC: number;
  observedAt: string;
};

export async function fetchWeatherForRoute(routeId: string): Promise<WeatherSnapshot> {
  return {
    routeId,
    rainChance: 40,
    temperatureC: 29,
    observedAt: new Date().toISOString()
  };
}
