import {
  BarChart3,
  Bus,
  CalendarCheck,
  CloudRain,
  Database,
  Footprints,
  MapPinned,
  Navigation,
  Route,
  TrainFront,
  TrendingUp
} from "lucide-react";

export const mockUser = {
  name: "Kalakbay rider",
  initials: "KR",
  schoolOrWorkplace: "Daily commute"
};

export const mockRoutes = [
  {
    id: "1",
    routeName: "Home -> City center",
    originName: "Home",
    originLat: 14.676,
    originLng: 121.043,
    destinationName: "City center",
    destinationLat: 14.578,
    destinationLng: 120.985,
    mode: "Walking",
    distanceKm: 3.2,
    estimatedMinutes: 28,
    isFavorite: true,
    latestLog: "Today",
    condition: "Good",
    icon: Footprints
  },
  {
    id: "2",
    routeName: "Market -> Work",
    originName: "Market",
    originLat: 14.583,
    originLng: 120.986,
    destinationName: "Work",
    destinationLat: 14.604,
    destinationLng: 121.02,
    mode: "Jeepney",
    distanceKm: 5.8,
    estimatedMinutes: 42,
    isFavorite: false,
    latestLog: "Yesterday",
    condition: "Crowded",
    icon: Bus
  },
  {
    id: "3",
    routeName: "Home -> MRT North",
    originName: "Home",
    originLat: 14.671,
    originLng: 121.035,
    destinationName: "MRT North Avenue",
    destinationLat: 14.654,
    destinationLng: 121.033,
    mode: "Train",
    distanceKm: 7.1,
    estimatedMinutes: 35,
    isFavorite: true,
    latestLog: "Fri",
    condition: "Moderate",
    icon: TrainFront
  }
];

export const routeLogs = [
  { id: "l1", route: "Home -> City center", date: "Today", duration: 31, crowd: "moderate", rating: 4, notes: "Light rain near the main road." },
  { id: "l2", route: "Market -> Work", date: "Yesterday", duration: 46, crowd: "crowded", rating: 3, notes: "Long queue at the terminal." },
  { id: "l3", route: "Home -> MRT North", date: "Friday", duration: 35, crowd: "light", rating: 5, notes: "Fast transfer." },
  { id: "l4", route: "Home -> City center", date: "Thursday", duration: 29, crowd: "moderate", rating: 4, notes: "Clear skies." }
];

export const insightMetrics = [
  { label: "Saved Routes", value: "3", sub: "+1 this week", tone: "blue" as const, icon: Route },
  { label: "Logs This Month", value: "18", sub: "+5 from last month", tone: "teal" as const, icon: CalendarCheck },
  { label: "Avg Commute", value: "34m", sub: "6m faster than usual", tone: "amber" as const, icon: TrendingUp },
  { label: "Pipeline Status", value: "Partial", sub: "2 routes skipped", tone: "amber" as const, icon: Database }
];

export const mobileMetrics = [
  { label: "Avg time", value: "34m", sub: "-6m", tone: "teal" as const },
  { label: "Logs", value: "18", sub: "May", tone: "blue" as const },
  { label: "Rating", value: "4.2", sub: "avg", tone: "amber" as const }
];

export const commuteDurationSeries = [
  { day: "Mon", minutes: 36 },
  { day: "Tue", minutes: 41 },
  { day: "Wed", minutes: 34 },
  { day: "Thu", minutes: 29 },
  { day: "Fri", minutes: 35 },
  { day: "Sat", minutes: 27 },
  { day: "Sun", minutes: 31 }
];

export const routeUsageSeries = [
  { route: "UP", logs: 9 },
  { route: "Work", logs: 5 },
  { route: "MRT", logs: 4 }
];

export const crowdLevelSeries = [
  { level: "Light", value: 22 },
  { level: "Moderate", value: 48 },
  { level: "Crowded", value: 24 },
  { level: "Very", value: 6 }
];

export const weatherSeries = [
  { day: "Mon", rain: 18, temp: 31 },
  { day: "Tue", rain: 35, temp: 30 },
  { day: "Wed", rain: 40, temp: 29 },
  { day: "Thu", rain: 24, temp: 31 },
  { day: "Fri", rain: 52, temp: 28 }
];

export const airQualitySeries = [
  { day: "Mon", aqi: 53 },
  { day: "Tue", aqi: 61 },
  { day: "Wed", aqi: 68 },
  { day: "Thu", aqi: 57 },
  { day: "Fri", aqi: 64 }
];

export const pipelineLogs = [
  { source: "open_meteo_weather", status: "Success", rows: 3, executedAt: "Today, 6:00 AM", error: "None" },
  { source: "open_meteo_air_quality", status: "Success", rows: 12, executedAt: "Today, 6:02 AM", error: "None" },
  { source: "osrm_route", status: "Partial", rows: 832, executedAt: "Today, 6:04 AM", error: "2 routes skipped" },
  { source: "manual_refresh_test", status: "Failed", rows: 0, executedAt: "Today, 6:05 AM", error: "Connection timeout" }
];

export const dashboardActions = [
  { label: "Routes", icon: MapPinned, href: "/routes" },
  { label: "Log", icon: CalendarCheck, href: "/logs" },
  { label: "Track", icon: Navigation, href: "/tracking" },
  { label: "Pipeline", icon: Database, href: "/pipeline" }
];

export const commuteContext = {
  route: "Home -> City center",
  via: "Via Commonwealth Ave · 3.2 km",
  estimated: "28 min",
  rainChance: "40%",
  airQuality: "Moderate",
  tip: "Bring an umbrella. Rain is expected after 2 PM along your route.",
  icon: CloudRain
};
