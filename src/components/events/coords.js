export const POLAND_CENTER = { lat: 52.0, lon: 19.0 };

export function toNumber(value) {
  return Number(value);
}

export function hasValidCoords(location) {
  const lat = toNumber(location?.lat);
  const lon = toNumber(location?.lon);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export function getSafeMapLocation(location) {
  if (hasValidCoords(location)) {
    return {
      lat: toNumber(location.lat),
      lon: toNumber(location.lon),
    };
  }

  return POLAND_CENTER;
}
