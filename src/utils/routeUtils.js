/**
 * Geographic distance utilities for route calculations.
 * Exported separately so they can be unit-tested independently.
 */

/**
 * Returns the great-circle distance in metres between two lat/lon points
 * using the Haversine formula.
 */
export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6_371_000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns the total length of a GeoJSON polyline in metres.
 * @param {Array<[number, number]>} coords – array of [lon, lat] pairs (GeoJSON order).
 */
export function polylineDistance(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return 0;

  let distance = 0;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    distance += getDistanceInMeters(lat1, lon1, lat2, lon2);
  }
  return distance;
}
