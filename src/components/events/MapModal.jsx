import React from "react";

const POLAND_CENTER = { lat: 52.0, lon: 19.0 };

function toNumber(value) {
  return Number(value);
}

function hasCoords(location) {
  const lat = toNumber(location?.lat);
  const lon = toNumber(location?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function buildEmbedUrl(lat, lon) {
  const delta = 0.02;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function MapModal({ location, title, onClose }) {
  const lat = hasCoords(location) ? toNumber(location.lat) : POLAND_CENTER.lat;
  const lon = hasCoords(location) ? toNumber(location.lon) : POLAND_CENTER.lon;
  const embedUrl = buildEmbedUrl(lat, lon);

  return (
    <div className="map-overlay" onClick={onClose}>
      <div className="map-card" onClick={(event) => event.stopPropagation()}>
        <div className="map-card-header">
          <h3>📍 {title || "Event Location"}</h3>
          <button
            className="map-close-btn"
            onClick={onClose}
            aria-label="Close map"
          >
            ✕
          </button>
        </div>

        <div className="map-container map-container-embed">
          <iframe
            title="Event map"
            src={embedUrl}
            loading="lazy"
            style={{ border: 0, width: "100%", height: "100%" }}
          />
        </div>

        {location?.display_name && (
          <div className="map-location-label">📍 {location.display_name}</div>
        )}
      </div>
    </div>
  );
}
