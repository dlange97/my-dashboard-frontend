import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RouteDrawing from "./RouteDrawing";
import api from "../../api/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const POLAND_CENTER = [52.0, 19.0];
const POLAND_ZOOM = 6;

const MAP_LAYERS = {
  osm: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  },
  topo: {
    name: "Topographic",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
  },
};

const toNumber = (value) => Number(value);
const normalizeText = (value) => String(value ?? "").toLowerCase();

const hasValidCoords = (location) => {
  const lat = toNumber(location?.lat);
  const lon = toNumber(location?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon);
};

function getEventStatus(event) {
  if (!event?.startAt) return "upcoming";

  const now = new Date();
  const eventStart = new Date(event.startAt);
  const eventEnd = event.endAt ? new Date(event.endAt) : eventStart;

  if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
    return "upcoming";
  }

  if (now > eventEnd) return "past";
  if (now >= eventStart && now <= eventEnd) return "today";
  return "upcoming";
}

function FlyTo({ lat, lon }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 13, { duration: 1.2 });
    }
  }, [lat, lon, map]);

  return null;
}

export function MapModal({ location, title, onClose }) {
  const hasLocation = hasValidCoords(location);
  const lat = toNumber(location?.lat);
  const lon = toNumber(location?.lon);

  return (
    <div className="map-overlay" onClick={onClose}>
      <div className="map-card" onClick={(e) => e.stopPropagation()}>
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
          <MapContainer
            center={hasLocation ? [lat, lon] : POLAND_CENTER}
            zoom={hasLocation ? 13 : POLAND_ZOOM}
            style={{ height: "100%", width: "100%" }}
          >
            <LayersControl position="topright">
              {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                <LayersControl.BaseLayer
                  key={key}
                  name={layer.name}
                  checked={key === "osm"}
                >
                  <TileLayer attribution={layer.attribution} url={layer.url} />
                </LayersControl.BaseLayer>
              ))}
            </LayersControl>

            {hasLocation && (
              <>
                <FlyTo lat={lat} lon={lon} />
                <Marker position={[lat, lon]}>
                  <Popup>{location.display_name}</Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>

        {location?.display_name && (
          <div className="map-location-label">📍 {location.display_name}</div>
        )}
      </div>
    </div>
  );
}

export function FullMap({ events = [], canManageRoutes = false }) {
  const [filters, setFilters] = useState({
    upcoming: true,
    today: true,
    past: false,
  });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchText, setSearchText] = useState("");
  const [showRouteDrawing, setShowRouteDrawing] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    let mounted = true;

    api
      .getRoutes()
      .then((data) => {
        if (mounted) setRoutes(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingRoutes(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const mappableEvents = events.filter((event) =>
    hasValidCoords(event.location),
  );

  const filteredEvents = mappableEvents.filter((event) => {
    const status = getEventStatus(event);
    if (!filters[status]) return false;

    const search = searchText.trim().toLowerCase();
    if (
      search &&
      !normalizeText(event.title).includes(search) &&
      !normalizeText(event.location?.display_name).includes(search)
    ) {
      return false;
    }

    const eventDate = new Date(event.startAt);
    if (Number.isNaN(eventDate.getTime())) return false;

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      if (eventDate < startDate) return false;
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (eventDate > endDate) return false;
    }

    return true;
  });

  const handleClearFilters = () => {
    setFilters({ upcoming: true, today: true, past: false });
    setDateRange({ start: "", end: "" });
    setSearchText("");
  };

  const handleRouteSave = async (routeData) => {
    const saved = await api.createRoute(routeData);
    setRoutes((prev) => [...prev, saved]);
    return saved;
  };

  const handleRouteUpdate = async (routeId, routeData) => {
    const updated = await api.updateRoute(routeId, routeData);
    setRoutes((prev) =>
      prev.map((route) =>
        route.id === routeId ? { ...route, ...updated } : route,
      ),
    );
    return updated;
  };

  const handleRouteDelete = async (routeId) => {
    await api.deleteRoute(routeId);
    setRoutes((prev) => prev.filter((route) => route.id !== routeId));
  };

  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      <div className="map-filter-panel">
        <div className="map-filter-header">
          <h4>🔍 Filtry Mapy</h4>
          <div className="map-filter-actions">
            <button
              className="map-filter-clear-btn"
              onClick={handleClearFilters}
              title="Wyczyść wszystkie filtry"
            >
              Wyczyść
            </button>
            <button
              className="map-route-btn"
              disabled={!canManageRoutes}
              title={
                canManageRoutes
                  ? "Rysuj trasę"
                  : "Brak uprawnienia: routes.manage"
              }
              onClick={() => setShowRouteDrawing((prev) => !prev)}
            >
              🛤️ {showRouteDrawing ? "Zamknij" : "Trasa"}
            </button>
          </div>
        </div>

        <div className="map-filter-row">
          <input
            type="text"
            placeholder="Szukaj po nazwie lub lokalizacji..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="map-filter-search"
          />
        </div>

        <div className="map-filter-row map-filter-row-dates">
          <label>
            Od:
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="map-filter-date"
            />
          </label>
          <label>
            Do:
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="map-filter-date"
            />
          </label>
        </div>

        <div className="map-filter-row">
          <label className="map-filter-checkbox">
            <input
              type="checkbox"
              checked={filters.upcoming}
              onChange={() =>
                setFilters((prev) => ({ ...prev, upcoming: !prev.upcoming }))
              }
            />
            <span>
              📅 Zbliżające się (
              {
                mappableEvents.filter((e) => getEventStatus(e) === "upcoming")
                  .length
              }
              )
            </span>
          </label>
          <label className="map-filter-checkbox">
            <input
              type="checkbox"
              checked={filters.today}
              onChange={() =>
                setFilters((prev) => ({ ...prev, today: !prev.today }))
              }
            />
            <span>
              🔴 Trwające (
              {
                mappableEvents.filter((e) => getEventStatus(e) === "today")
                  .length
              }
              )
            </span>
          </label>
          <label className="map-filter-checkbox">
            <input
              type="checkbox"
              checked={filters.past}
              onChange={() =>
                setFilters((prev) => ({ ...prev, past: !prev.past }))
              }
            />
            <span>
              ⚫ Minione (
              {
                mappableEvents.filter((e) => getEventStatus(e) === "past")
                  .length
              }
              )
            </span>
          </label>
        </div>

        <div className="map-filter-info">
          <div className="map-filter-info-row">
            <span>
              Wyniki: <strong>{filteredEvents.length}</strong> z{" "}
              <strong>{mappableEvents.length}</strong> eventów
            </span>
            {!loadingRoutes && routes.length > 0 && (
              <span>
                Trasy: <strong>{routes.length}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={POLAND_CENTER}
          zoom={POLAND_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          {showRouteDrawing && canManageRoutes && (
            <RouteDrawing
              onRouteSave={handleRouteSave}
              onRouteUpdate={handleRouteUpdate}
              onRouteDelete={handleRouteDelete}
              onCancel={() => setShowRouteDrawing(false)}
              existingRoutes={routes}
            />
          )}

          <LayersControl position="topright">
            {Object.entries(MAP_LAYERS).map(([key, layer]) => (
              <LayersControl.BaseLayer
                key={key}
                name={layer.name}
                checked={key === "osm"}
              >
                <TileLayer attribution={layer.attribution} url={layer.url} />
              </LayersControl.BaseLayer>
            ))}
          </LayersControl>

          {filteredEvents.map((event) => (
            <Marker
              key={event.id}
              position={[
                toNumber(event.location.lat),
                toNumber(event.location.lon),
              ]}
              title={event.title}
            >
              <Popup className="map-event-popup">
                <div className="map-event-popup-content">
                  <strong className="map-popup-title">{event.title}</strong>
                  <div className="map-popup-detail">
                    📍 {event.location.display_name}
                  </div>
                  <div className="map-popup-detail">
                    📅 {new Date(event.startAt).toLocaleDateString("pl-PL")}
                  </div>
                  <div className="map-popup-detail">
                    🕒{" "}
                    {new Date(event.startAt).toLocaleTimeString("pl-PL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {event.description && (
                    <div className="map-popup-description">
                      {event.description}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {routes
            .filter(
              (route) =>
                route?.geoJson &&
                typeof route.geoJson === "object" &&
                !Array.isArray(route.geoJson),
            )
            .map((route) => (
              <GeoJSON
                key={`route-${route.id ?? route.name}`}
                data={route.geoJson}
                style={{ color: "#6366f1", weight: 4, opacity: 0.8 }}
                onEachFeature={(_feature, layer) => {
                  const distKm =
                    route.distanceMeters != null
                      ? `<br/><span style="font-size:0.82em">📏 ${(route.distanceMeters / 1000).toFixed(2)} km</span>`
                      : "";
                  layer.bindPopup(
                    `<div style="min-width:150px"><strong>🛤️ ${route.name || "Trasa"}</strong>${distKm}</div>`,
                  );
                }}
              />
            ))}
        </MapContainer>

        <div className="map-legend">
          <h5>Legenda</h5>
          <div className="map-legend-item">
            <span className="map-legend-icon">📍</span>
            <span>Zbliżające się</span>
          </div>
          <div className="map-legend-item">
            <span className="map-legend-icon">🔴</span>
            <span>Trwające</span>
          </div>
          <div className="map-legend-item">
            <span className="map-legend-icon">⚫</span>
            <span>Minione</span>
          </div>
          <div className="map-legend-item">
            <span className="map-legend-icon">🛤️</span>
            <span>Trasa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
