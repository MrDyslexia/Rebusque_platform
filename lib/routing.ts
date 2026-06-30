export type RoutingWaypoint = {
  coordinates: [number, number];
  type: "branch" | "pickup" | "delivery";
  orderId?: string;
  sequence: number;
};

export type RoutePath = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RoutePlan = {
  path: RoutePath;
  distanceKm: number;
  estimatedMinutes: number;
};

/**
 * Builds a route path from waypoints.
 *
 * Today this is a local placeholder that connects waypoints with straight
 * lines. When the street-level routing API is ready, replace this function
 * body with an async call to that service and await the result.
 *
 * The input/output shape must stay stable: waypoints in order, path as a
 * GeoJSON LineString, plus distance and time estimates.
 */
export function buildRoutePath(waypoints: RoutingWaypoint[]): RoutePlan {
  const coordinates = waypoints.map((waypoint) => waypoint.coordinates);

  const distanceKm = estimateDistanceKm(coordinates);
  const estimatedMinutes = Math.max(
    0,
    Math.round(distanceKm * 3 + waypoints.filter((w) => w.type !== "branch").length * 8),
  );

  return {
    path: { type: "LineString", coordinates },
    distanceKm,
    estimatedMinutes,
  };
}

function estimateDistanceKm(coordinates: [number, number][]) {
  if (coordinates.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < coordinates.length; i += 1) {
    const [lngA, latA] = coordinates[i - 1];
    const [lngB, latB] = coordinates[i];
    const latKm = (latB - latA) * 111;
    const lngKm =
      (lngB - lngA) * 111 * Math.cos(((latA + latB) / 2) * (Math.PI / 180));
    total += Math.sqrt(latKm ** 2 + lngKm ** 2);
  }

  return Math.round(total * 10) / 10;
}
