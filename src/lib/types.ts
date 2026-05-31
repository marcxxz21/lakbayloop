export type PreferredMode = "Walking" | "Jeepney" | "Bus" | "Train" | "Bike" | "Car" | "Mixed";
export type CrowdLevel = "light" | "moderate" | "crowded" | "very crowded";
export type PipelineStatus = "Success" | "Partial" | "Failed";

export type AppUser = {
  id: string;
  session_id: string;
  full_name: string;
  email: string | null;
  school_or_workplace: string;
  preferred_mode: PreferredMode;
  created_at: string;
  updated_at: string;
};

export type SavedRoute = {
  id: string;
  session_id: string;
  route_name: string;
  origin_name: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_name: string;
  destination_lat: number | null;
  destination_lng: number | null;
  preferred_mode: PreferredMode;
  is_favorite: boolean;
  distance_km: number;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
  latest_log?: string | null;
  condition?: string;
};

export type RouteLog = {
  id: string;
  session_id: string;
  route_id: string | null;
  travel_date: string;
  actual_duration_minutes: number;
  crowd_level: CrowdLevel;
  rating: number;
  notes: string | null;
  created_at: string;
  ll_saved_routes?: Pick<SavedRoute, "route_name" | "preferred_mode"> | null;
};

export type PipelineLog = {
  id: string;
  session_id: string;
  source: string;
  status: PipelineStatus;
  rows_inserted: number;
  executed_at: string;
  error_message: string | null;
};

export type DashboardData = {
  user: AppUser;
  routes: SavedRoute[];
  favoriteRoutes: SavedRoute[];
  logs: RouteLog[];
  metrics: {
    savedRoutes: number;
    logsThisMonth: number;
    avgCommute: number;
    pipelineStatus: PipelineStatus;
  };
  today: {
    route: SavedRoute | null;
    rainChance: number;
    airQuality: string;
    tip: string;
  };
};

export type InsightsData = {
  averageCommuteTime: number;
  mostUsedRoute: string;
  averageRating: number;
  mostCommonCrowdLevel: string;
  logsThisMonth: number;
  durationTrend: { day: string; minutes: number }[];
  routeUsage: { route: string; logs: number }[];
  crowdDistribution: { level: string; value: number }[];
  recentLogs: RouteLog[];
};
