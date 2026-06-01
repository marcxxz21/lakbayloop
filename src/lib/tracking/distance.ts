export type TrackablePoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number;
};

export function calculateDistanceMeters(
  pointA: { latitude: number; longitude: number },
  pointB: { latitude: number; longitude: number }
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(pointB.latitude - pointA.latitude);
  const deltaLongitude = toRadians(pointB.longitude - pointA.longitude);
  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function calculateTrackedDistanceMeters(points: TrackablePoint[]) {
  return points.reduce((total, point, index) => {
    if (index === 0 || isLowConfidencePoint(point)) return total;

    const previous = points[index - 1];
    if (!previous || isLowConfidencePoint(previous)) return total;

    const segmentMeters = calculateDistanceMeters(previous, point);
    const elapsedSeconds = point.timestamp && previous.timestamp
      ? Math.max(1, (point.timestamp - previous.timestamp) / 1000)
      : null;
    const metersPerSecond = elapsedSeconds ? segmentMeters / elapsedSeconds : 0;

    if (segmentMeters > 250 && metersPerSecond > 55) return total;
    return total + segmentMeters;
  }, 0);
}

function isLowConfidencePoint(point: TrackablePoint) {
  return typeof point.accuracy === "number" && point.accuracy > 100;
}
