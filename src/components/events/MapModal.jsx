import React from "react";
import EventLocationMap from "./EventLocationMap";

export default function MapModal({ location, title, onClose }) {
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

        <div className="map-container">
          <EventLocationMap location={location} title={title} height="100%" />
        </div>

        {location?.display_name && (
          <div className="map-location-label">📍 {location.display_name}</div>
        )}
      </div>
    </div>
  );
}
