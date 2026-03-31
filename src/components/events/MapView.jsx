import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  LayersControl,
  GeoJSON,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import RouteDrawing from "./RouteDrawing";
import api from "../../api/api";
import { ConfirmModal } from "../ui";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const POLAND_CENTER = [52.0, 19.0];
const POLAND_ZOOM = 6;
const DEFAULT_ROUTE_COLOR = "#6366f1";

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
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const hasValidCoords = (location) => {
  const lat = toNumber(location?.lat);
  const lon = toNumber(location?.lon);
  return Number.isFinite(lat) && Number.isFinite(lon);
};

const EVENT_MARKER_ICONS = {
  upcoming: L.divIcon({
    className: "map-marker-dot map-marker-dot-upcoming",
    html: "<span></span>",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  }),
  today: L.divIcon({
    className: "map-marker-dot map-marker-dot-today",
    html: "<span></span>",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  }),
  past: L.divIcon({
    className: "map-marker-dot map-marker-dot-past",
    html: "<span></span>",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  }),
};

const POINT_MARKER_ICON = L.divIcon({
  className: "map-marker-pin",
  html: "<span>📌</span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

function buildFallbackLocation(lat, lon) {
  const latFixed = lat.toFixed(5);
  const lonFixed = lon.toFixed(5);

  return {
    display_name: `Współrzędne: ${latFixed}, ${lonFixed}`,
    lat,
    lon,
    suggestedTitle: `Event (${latFixed}, ${lonFixed})`,
  };
}

async function resolveLocationForClick(lat, lon) {
  const fallback = buildFallbackLocation(lat, lon);

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 2500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "pl,en" },
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    const displayName = payload?.display_name;
    if (!displayName) {
      return fallback;
    }

    const locality =
      payload?.address?.city ||
      payload?.address?.town ||
      payload?.address?.village ||
      payload?.address?.municipality ||
      payload?.address?.county ||
      "Wybrana lokalizacja";

    return {
      display_name: displayName,
      lat,
      lon,
      suggestedTitle: `Event: ${locality}`,
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

function MapClickCapture({ enabled, onMapClick }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onMapClick?.(event.latlng);
    },
  });

  return null;
}

/** Calls invalidateSize after mount so Leaflet recalculates when flex layout is ready. */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Small delay ensures the flex container has finished painting
    const id = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(id);
  }, [map]);
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

export function FullMap({
  events = [],
  canManageRoutes = false,
  canManageEvents = false,
  currentUserId = null,
  onCreateEventAtLocation,
  onEditEvent,
  onDeleteEvent,
  onShareEvent,
}) {
  const [filters, setFilters] = useState({
    upcoming: true,
    today: true,
    past: false,
  });
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchText, setSearchText] = useState("");
  const [showRouteDrawing, setShowRouteDrawing] = useState(false);
  const [addPointMode, setAddPointMode] = useState(false);
  const [addEventMode, setAddEventMode] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [routeActionRequest, setRouteActionRequest] = useState(null);
  const [customPoints, setCustomPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [pointForm, setPointForm] = useState(null);
  const [pointActionError, setPointActionError] = useState("");
  const [pointSaving, setPointSaving] = useState(false);
  const [pendingDeletePointId, setPendingDeletePointId] = useState(null);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState(null);
  // Start collapsed on mobile so the map has room to render
  const [filterOpen, setFilterOpen] = useState(() => window.innerWidth > 640);

  useEffect(() => {
    let mounted = true;

    api
      .getMapPoints()
      .then((data) => {
        if (!mounted) return;
        setCustomPoints(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setCustomPoints([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingPoints(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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

  const handleRoutePopupAction = (actionType, routeId) => {
    if (!canManageRoutes || !routeId) return;

    setShowRouteDrawing(true);
    setRouteActionRequest({
      key: `${actionType}-${routeId}-${Date.now()}`,
      type: actionType,
      routeId,
    });
  };

  const openPointForm = (point) => {
    setPointActionError("");
    setPointForm({
      id: point?.id ?? null,
      name: point?.name ?? "",
      description: point?.description ?? "",
      lat: Number(point?.lat ?? 0),
      lon: Number(point?.lon ?? 0),
    });
  };

  const handleMapPointClick = (latLng) => {
    if (!addPointMode || !latLng) return;

    openPointForm({
      lat: latLng.lat,
      lon: latLng.lng,
    });
  };

  const handleMapEventClick = async (latLng) => {
    if (!addEventMode || !canManageEvents || !latLng) return;

    const lat = Number(latLng.lat);
    const lon = Number(latLng.lng);
    const fallbackLocation = buildFallbackLocation(lat, lon);

    setAddEventMode(false);
    onCreateEventAtLocation?.(fallbackLocation);

    const resolvedLocation = await resolveLocationForClick(lat, lon);
    if (
      resolvedLocation.display_name !== fallbackLocation.display_name ||
      resolvedLocation.suggestedTitle !== fallbackLocation.suggestedTitle
    ) {
      onCreateEventAtLocation?.(resolvedLocation);
    }
  };

  const handleMapClick = (latLng) => {
    if (addPointMode) {
      handleMapPointClick(latLng);
      return;
    }

    if (addEventMode) {
      handleMapEventClick(latLng);
    }
  };

  const handlePointSave = async () => {
    if (!pointForm) return;

    setPointActionError("");
    const name = pointForm.name.trim();
    if (!name) {
      setPointActionError("Podaj nazwę punktu.");
      return;
    }

    const pointPayload = {
      name,
      description: pointForm.description.trim(),
      lat: Number(pointForm.lat),
      lon: Number(pointForm.lon),
    };

    try {
      setPointSaving(true);
      if (pointForm.id != null) {
        const updated = await api.updateMapPoint(pointForm.id, pointPayload);
        setCustomPoints((prev) =>
          prev.map((point) => (point.id === pointForm.id ? updated : point)),
        );
      } else {
        const created = await api.createMapPoint(pointPayload);
        setCustomPoints((prev) => [created, ...prev]);
      }
      setPointForm(null);
    } catch (error) {
      setPointActionError(error.message || "Nie udało się zapisać punktu.");
    } finally {
      setPointSaving(false);
    }
  };

  const handlePointDelete = async () => {
    if (!pendingDeletePointId) return;

    try {
      await api.deleteMapPoint(pendingDeletePointId);
      setCustomPoints((prev) =>
        prev.filter((point) => point.id !== pendingDeletePointId),
      );
      setPendingDeletePointId(null);
    } catch (error) {
      setPointActionError(error.message || "Nie udało się usunąć punktu.");
    }
  };

  const handleEventDelete = async () => {
    if (!pendingDeleteEvent || !onDeleteEvent) {
      setPendingDeleteEvent(null);
      return;
    }

    await onDeleteEvent(pendingDeleteEvent);
    setPendingDeleteEvent(null);
  };

  const [legendOpen, setLegendOpen] = useState(
    () => window.innerWidth > 640,
  );

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        className={`map-filter-panel${filterOpen ? "" : " map-filter-panel--collapsed"}`}
      >
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
            <button
              className={`map-point-btn${addPointMode ? " active" : ""}`}
              aria-label="Dodaj punkt"
              onClick={() => {
                setAddPointMode((prev) => {
                  const next = !prev;
                  if (next) setAddEventMode(false);
                  return next;
                });
              }}
              title="Tryb dodawania punktów"
            >
              📌
            </button>
            <button
              className={`map-event-btn${addEventMode ? " active" : ""}`}
              aria-label="Dodaj event"
              disabled={!canManageEvents}
              title={
                canManageEvents
                  ? "Tryb dodawania eventu po kliknięciu mapy"
                  : "Brak uprawnienia: events.manage"
              }
              onClick={() => {
                setAddEventMode((prev) => {
                  const next = !prev;
                  if (next) setAddPointMode(false);
                  return next;
                });
              }}
            >
              ➕
            </button>
            <button
              className="map-filter-toggle-btn"
              onClick={() => setFilterOpen((o) => !o)}
              title={filterOpen ? "Zwiń filtry" : "Rozwiń filtry"}
            >
              {filterOpen ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {filterOpen && (
          <>
            {addPointMode && (
              <div className="map-point-mode-note">
                Kliknij mapę, aby dodać punkt. Każdy punkt można potem edytować
                lub usunąć.
              </div>
            )}

            {addEventMode && (
              <div className="map-event-mode-note">
                Kliknij mapę, aby otworzyć formularz nowego eventu z tą
                lokalizacją.
              </div>
            )}

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
                    setFilters((prev) => ({
                      ...prev,
                      upcoming: !prev.upcoming,
                    }))
                  }
                />
                <span>
                  📅 Zbliżające się (
                  {
                    mappableEvents.filter(
                      (e) => getEventStatus(e) === "upcoming",
                    ).length
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
                {!loadingPoints && customPoints.length > 0 && (
                  <span>
                    Punkty: <strong>{customPoints.length}</strong>
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <MapContainer
          center={POLAND_CENTER}
          zoom={POLAND_ZOOM}
          style={{ height: "100%", width: "100%", minHeight: "200px" }}
        >
          <MapResizer />
          <MapClickCapture
            enabled={addPointMode || addEventMode}
            onMapClick={handleMapClick}
          />

          {showRouteDrawing && canManageRoutes && (
            <RouteDrawing
              onRouteSave={handleRouteSave}
              onRouteUpdate={handleRouteUpdate}
              onRouteDelete={handleRouteDelete}
              onCancel={() => setShowRouteDrawing(false)}
              existingRoutes={routes}
              requestedAction={routeActionRequest}
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
              icon={
                EVENT_MARKER_ICONS[getEventStatus(event)] ??
                EVENT_MARKER_ICONS.upcoming
              }
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
                  {canManageEvents && (
                    <div className="map-popup-actions">
                      {event.ownerId &&
                        currentUserId &&
                        event.ownerId === currentUserId && (
                          <button
                            type="button"
                            className="map-popup-action-btn"
                            onClick={() => onShareEvent?.(event)}
                            title="Udostępnij"
                          >
                            👥
                          </button>
                        )}
                      <button
                        type="button"
                        className="map-popup-action-btn map-popup-action-btn-edit"
                        onClick={() => onEditEvent?.(event)}
                      >
                        Edytuj
                      </button>
                      <button
                        type="button"
                        className="map-popup-action-btn map-popup-action-btn-delete"
                        onClick={() => setPendingDeleteEvent(event)}
                      >
                        Usuń
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {customPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.lat, point.lon]}
              icon={POINT_MARKER_ICON}
            >
              <Popup className="map-event-popup">
                <div className="map-event-popup-content">
                  <strong className="map-popup-title">📌 {point.name}</strong>
                  <div className="map-popup-detail">
                    {point.lat.toFixed(5)}, {point.lon.toFixed(5)}
                  </div>
                  {point.description && (
                    <div className="map-popup-description">
                      {point.description}
                    </div>
                  )}
                  <div className="map-popup-actions">
                    <button
                      type="button"
                      className="map-popup-action-btn map-popup-action-btn-edit"
                      onClick={() => openPointForm(point)}
                    >
                      Edytuj punkt
                    </button>
                    <button
                      type="button"
                      className="map-popup-action-btn map-popup-action-btn-delete"
                      onClick={() => setPendingDeletePointId(point.id)}
                    >
                      Usuń punkt
                    </button>
                  </div>
                  {canManageEvents && (
                    <div className="map-popup-secondary-actions">
                      <button
                        type="button"
                        className="map-popup-action-btn"
                        onClick={() =>
                          onCreateEventAtLocation?.({
                            lat: point.lat,
                            lon: point.lon,
                            display_name: point.name,
                            suggestedTitle: `Event: ${point.name}`,
                          })
                        }
                      >
                        Utwórz event tutaj
                      </button>
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
                style={{
                  color: route?.color || DEFAULT_ROUTE_COLOR,
                  weight: 4,
                  opacity: 0.8,
                }}
                onEachFeature={(_feature, layer) => {
                  const distKm =
                    route.distanceMeters != null
                      ? `<br/><span style="font-size:0.82em">📏 ${(route.distanceMeters / 1000).toFixed(2)} km</span>`
                      : "";

                  const actionButtons =
                    canManageRoutes && route.id
                      ? `<div class="map-route-popup-actions"><button type="button" class="map-route-popup-btn map-route-popup-btn-edit js-route-edit">Edytuj</button><button type="button" class="map-route-popup-btn map-route-popup-btn-delete js-route-delete">Usuń</button></div>`
                      : "";

                  layer.bindPopup(
                    `<div class="map-route-popup-content"><strong class="map-route-popup-title">🛤️ ${escapeHtml(route.name || "Trasa")}</strong>${distKm}${actionButtons}</div>`,
                  );

                  layer.on("popupopen", (event) => {
                    if (!canManageRoutes || !route.id) return;

                    const popupElement = event.popup?.getElement();
                    if (!popupElement) return;

                    const editButton =
                      popupElement.querySelector(".js-route-edit");
                    const deleteButton =
                      popupElement.querySelector(".js-route-delete");

                    if (editButton) {
                      editButton.onclick = (popupEvent) => {
                        popupEvent.preventDefault();
                        popupEvent.stopPropagation();
                        handleRoutePopupAction("edit", route.id);
                      };
                    }

                    if (deleteButton) {
                      deleteButton.onclick = (popupEvent) => {
                        popupEvent.preventDefault();
                        popupEvent.stopPropagation();
                        handleRoutePopupAction("delete", route.id);
                      };
                    }
                  });
                }}
              />
            ))}
        </MapContainer>

        <div
          className={`map-legend${legendOpen ? "" : " map-legend--collapsed"}`}
          onClick={() => setLegendOpen((o) => !o)}
          style={{ cursor: "pointer" }}
        >
          <h5>Legenda {legendOpen ? "▾" : "▸"}</h5>
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
          <div className="map-legend-item">
            <span className="map-legend-icon">📌</span>
            <span>Punkt własny</span>
          </div>
          {loadingPoints && (
            <div className="map-legend-loading">Ładowanie punktów...</div>
          )}
        </div>
      </div>

      {pointForm && (
        <div
          className="map-point-form-overlay"
          onClick={() => setPointForm(null)}
        >
          <div
            className="map-point-form-card"
            onClick={(event) => event.stopPropagation()}
          >
            <h4>{pointForm.id ? "Edycja punktu" : "Nowy punkt"}</h4>
            {pointActionError && (
              <div className="map-point-form-error">{pointActionError}</div>
            )}
            <p className="map-point-form-coords">
              Współrzędne: {pointForm.lat.toFixed(5)},{" "}
              {pointForm.lon.toFixed(5)}
            </p>
            <label>
              Nazwa
              <input
                type="text"
                value={pointForm.name}
                onChange={(event) =>
                  setPointForm((prev) =>
                    prev ? { ...prev, name: event.target.value } : prev,
                  )
                }
                placeholder="Np. Punkt zbiórki"
                autoFocus
              />
            </label>
            <label>
              Opis
              <textarea
                value={pointForm.description}
                onChange={(event) =>
                  setPointForm((prev) =>
                    prev ? { ...prev, description: event.target.value } : prev,
                  )
                }
                placeholder="Dodatkowe informacje"
              />
            </label>
            <div className="map-point-form-actions">
              <button
                type="button"
                className="map-popup-action-btn"
                onClick={() => setPointForm(null)}
                disabled={pointSaving}
              >
                Anuluj
              </button>
              <button
                type="button"
                className="map-popup-action-btn map-popup-action-btn-edit"
                disabled={!pointForm.name.trim() || pointSaving}
                onClick={handlePointSave}
              >
                {pointSaving ? "Zapisywanie..." : "Zapisz"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeletePointId && (
        <ConfirmModal
          title="Usunąć punkt?"
          message="Punkt zostanie trwale usunięty z mapy."
          confirmLabel="Usuń"
          cancelLabel="Anuluj"
          onConfirm={handlePointDelete}
          onCancel={() => setPendingDeletePointId(null)}
        />
      )}

      {pendingDeleteEvent && (
        <ConfirmModal
          title="Usunąć event?"
          message={`Event \"${pendingDeleteEvent.title}\" zostanie trwale usunięty.`}
          confirmLabel="Usuń"
          cancelLabel="Anuluj"
          onConfirm={handleEventDelete}
          onCancel={() => setPendingDeleteEvent(null)}
        />
      )}
    </div>
  );
}
