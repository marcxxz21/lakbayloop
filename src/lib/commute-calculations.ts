import type { PreferredMode } from "@/lib/types";

const speedByModeKmH: Record<PreferredMode, number> = {
  Walking: 4.6,
  Jeepney: 11,
  Bus: 14,
  Train: 24,
  Bike: 13,
  Car: 18,
  Mixed: 12
};

export function calculateDistanceKm(originLat?: number | null, originLng?: number | null, destinationLat?: number | null, destinationLng?: number | null) {
  if ([originLat, originLng, destinationLat, destinationLng].some((value) => value === null || value === undefined || Number.isNaN(value))) {
    return 0;
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(destinationLat! - originLat!);
  const dLng = toRadians(destinationLng! - originLng!);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(originLat!)) * Math.cos(toRadians(destinationLat!)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(2));
}

export function estimateMinutes(distanceKm: number, mode: PreferredMode) {
  if (!distanceKm) return 0;
  const transferBuffer = mode === "Mixed" || mode === "Jeepney" || mode === "Bus" ? 10 : mode === "Train" ? 8 : 4;
  return Math.max(5, Math.round((distanceKm / speedByModeKmH[mode]) * 60 + transferBuffer));
}

export function estimateMinutesForModes(distanceKm: number, modes: PreferredMode[]) {
  if (!modes.length) return estimateMinutes(distanceKm, "Mixed");
  const slowestEstimate = Math.max(...modes.map((mode) => estimateMinutes(distanceKm, mode)));
  const transferBuffer = modes.length > 1 ? Math.min(14, modes.length * 4) : 0;
  return slowestEstimate + transferBuffer;
}

export function primaryMode(modes: PreferredMode[]) {
  return modes[0] ?? "Mixed";
}

export function formatModes(modes?: PreferredMode[] | null, fallback?: PreferredMode) {
  const values = modes?.length ? modes : fallback ? [fallback] : [];
  return values.length ? values.join(" + ") : "Mixed";
}

export function formatDateLabel(date: string) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  const diffDays = Math.round((startOfDay(today).getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
