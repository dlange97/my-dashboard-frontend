import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import { polylineDistance } from "../../utils/routeUtils";
import { ConfirmModal } from "../ui";

async function ensureLeafletDrawLoaded() {
  if (typeof window === "undefined") return;
  if (!L.Control?.Draw) {
    await import("leaflet-draw");
  }
}

export default function RouteDrawing({
  onRouteSave,
  onRouteUpdate,
  onRouteDelete,
  onCancel,
  existingRoutes = [],
}) {
  const map = useMap();
  const drawLayerRef = useRef(null);
  const existingLayerRef = useRef(null);
  const drawControlRef = useRef(null);
  const [drawReady, setDrawReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [drawLoadError, setDrawLoadError] = useState("");
  const [savedRoutes, setSavedRoutes] = useState(existingRoutes);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [activeRouteId, setActiveRouteId] = useState(null);
  const [pendingDeleteRoute, setPendingDeleteRoute] = useState(null);

  useEffect(() => {
    setSavedRoutes(existingRoutes);
  }, [existingRoutes]);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        await ensureLeafletDrawLoaded();
      } catch {
        if (!cancelled) {
          setDrawLoadError(
            "Nie udało się załadować narzędzi rysowania. Odśwież stronę i spróbuj ponownie.",
          );
        }
        return;
      }

      if (cancelled || !L.Control?.Draw) {
        if (!cancelled) {
          setDrawLoadError("Narzędzia rysowania nie są dostępne w tej sesji.");
        }
        return;
      }

      const drawLayer = new L.FeatureGroup();
      const existingLayer = new L.FeatureGroup();

      drawLayerRef.current = drawLayer;
      existingLayerRef.current = existingLayer;

      map.addLayer(existingLayer);
      map.addLayer(drawLayer);

      const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
          polyline: {
            shapeOptions: {
              color: "#ff7800",
              weight: 4,
              opacity: 0.85,
              dashArray: "6, 6",
            },
          },
          polygon: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawLayer,
          edit: false,
          remove: true,
        },
      });

      drawControlRef.current = drawControl;
      map.addControl(drawControl);

      const onCreated = (event) => {
        drawLayer.addLayer(event.layer);
      };

      map.on(L.Draw.Event.CREATED, onCreated);
      setDrawReady(true);
      setDrawLoadError("");

      return () => {
        map.off(L.Draw.Event.CREATED, onCreated);
      };
    };

    let teardownHandlers = null;

    setup().then((cleanupHandlers) => {
      teardownHandlers = cleanupHandlers;
    });

    return () => {
      cancelled = true;
      setDrawReady(false);
      setDrawLoadError("");
      if (teardownHandlers) teardownHandlers();

      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }

      if (drawLayerRef.current) {
        map.removeLayer(drawLayerRef.current);
        drawLayerRef.current = null;
      }

      if (existingLayerRef.current) {
        map.removeLayer(existingLayerRef.current);
        existingLayerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    const existingLayer = existingLayerRef.current;
    if (!existingLayer) return;

    existingLayer.clearLayers();

    existingRoutes.forEach((route) => {
      if (!route?.geoJson) return;
      L.geoJSON(route.geoJson, {
        style: {
          color: "#6366f1",
          weight: 3,
          opacity: 0.7,
        },
        interactive: false,
      }).addTo(existingLayer);
    });
  }, [existingRoutes]);

  const handleSaveRoute = async () => {
    setError("");

    if (!routeName.trim()) {
      setError("Podaj nazwę trasy.");
      return;
    }

    const drawLayer = drawLayerRef.current;
    const editedRoute =
      editingRouteId !== null
        ? (savedRoutes.find((route) => route.id === editingRouteId) ?? null)
        : null;

    if (
      (!drawLayer || drawLayer.getLayers().length === 0) &&
      editingRouteId === null
    ) {
      setError("Narysuj trasę na mapie przed zapisem.");
      return;
    }

    const features = [];
    let totalDistance = 0;
    let waypoints = [];

    drawLayer.eachLayer((layer) => {
      if (!(layer instanceof L.Polyline) || layer instanceof L.Polygon) return;

      const coordinates = layer
        .getLatLngs()
        .map((latLng) => [latLng.lng, latLng.lat]);

      if (coordinates.length < 2) return;

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
        properties: {
          name: routeName.trim(),
        },
      });

      totalDistance += polylineDistance(coordinates);
      waypoints = coordinates.map(([lon, lat]) => [lat, lon]);
    });

    if (features.length === 0 && editingRouteId === null) {
      setError("Trasa musi zawierać minimum dwa punkty.");
      return;
    }

    const payload = {
      name: routeName.trim(),
      description: routeDescription.trim(),
      geoJson:
        features.length > 0
          ? {
              type: "FeatureCollection",
              features,
            }
          : editedRoute?.geoJson,
      distanceMeters:
        features.length > 0
          ? Math.round(totalDistance)
          : (editedRoute?.distanceMeters ?? null),
      durationMinutes:
        features.length > 0
          ? Math.max(1, Math.ceil(totalDistance / 1400))
          : (editedRoute?.durationMinutes ?? null),
      waypoints:
        features.length > 0 ? waypoints : (editedRoute?.waypoints ?? []),
    };

    try {
      setSaving(true);
      const saved =
        editingRouteId !== null
          ? await onRouteUpdate(editingRouteId, payload)
          : await onRouteSave(payload);

      setRouteName("");
      setRouteDescription("");
      setShowForm(false);
      setEditingRouteId(null);
      drawLayer.clearLayers();

      if (saved) {
        setSavedRoutes((prev) => {
          if (editingRouteId !== null) {
            return prev.map((route) =>
              route.id === editingRouteId ? { ...route, ...saved } : route,
            );
          }

          return [...prev, saved];
        });
      }
    } catch (err) {
      setError(err.message || "Nie udało się zapisać trasy.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditRoute = (route) => {
    setEditingRouteId(route.id ?? null);
    setRouteName(route.name ?? "");
    setRouteDescription(route.description ?? "");
    setShowForm(true);
    setError("");
  };

  const handleDeleteRoute = async () => {
    if (!pendingDeleteRoute?.id) {
      setPendingDeleteRoute(null);
      return;
    }

    try {
      await onRouteDelete(pendingDeleteRoute.id);
      setSavedRoutes((prev) =>
        prev.filter((route) => route.id !== pendingDeleteRoute.id),
      );
    } catch (err) {
      setError(err.message || "Nie udało się usunąć trasy.");
    } finally {
      setPendingDeleteRoute(null);
    }
  };

  return (
    <div className="route-drawing-container">
      <div className="route-drawing-panel">
        <div className="route-panel-header">
          <h4>🛤️ Rysuj Trasę</h4>
          <button className="route-panel-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        {!showForm ? (
          <div className="route-panel-content">
            {drawLoadError && (
              <div className="route-draw-warning">{drawLoadError}</div>
            )}
            <p className="route-instructions">
              💡 Użyj narzędzi rysowania po lewej stronie mapy, aby dodać punkty
              trasy.
            </p>
            <button
              className="route-save-btn"
              onClick={() => setShowForm(true)}
              disabled={!drawReady}
            >
              💾 Zapisz Trasę
            </button>
            <button className="route-cancel-btn" onClick={onCancel}>
              Anuluj
            </button>

            {savedRoutes.length > 0 && (
              <div className="saved-routes-list">
                <h5>📍 Zapisane Trasy ({savedRoutes.length})</h5>
                {savedRoutes.map((route, index) => (
                  <div
                    key={route.id ?? `${route.name}-${index}`}
                    className="saved-route-item"
                    onClick={() =>
                      setActiveRouteId((current) =>
                        current === route.id ? null : route.id,
                      )
                    }
                  >
                    <strong>{route.name}</strong>
                    <div className="route-stats">
                      📏 {((route.distanceMeters ?? 0) / 1000).toFixed(2)} km |
                      ⏱️ {route.durationMinutes ?? 0} min
                    </div>
                    {activeRouteId === route.id && (
                      <div className="saved-route-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditRoute(route);
                          }}
                        >
                          Edytuj
                        </button>
                        <button
                          type="button"
                          className="btn-secondary route-danger-btn"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDeleteRoute(route);
                          }}
                        >
                          Usuń
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="route-form">
            {error && <div className="route-form-error">{error}</div>}
            <input
              type="text"
              placeholder="Nazwa trasy"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="route-form-input"
            />
            <textarea
              placeholder="Opis (opcjonalnie)"
              value={routeDescription}
              onChange={(e) => setRouteDescription(e.target.value)}
              className="route-form-textarea"
            />
            <button
              className="btn-primary"
              onClick={handleSaveRoute}
              disabled={saving || !drawReady}
            >
              {saving ? "Zapisywanie..." : "✓ Potwierdź"}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setError("");
                setShowForm(false);
                setEditingRouteId(null);
              }}
              disabled={saving}
            >
              ← Wróć
            </button>
          </div>
        )}
      </div>

      {pendingDeleteRoute && (
        <ConfirmModal
          title="Usunąć trasę?"
          message={`Trasa \"${pendingDeleteRoute.name}\" zostanie trwale usunięta.`}
          confirmLabel="Usuń"
          cancelLabel="Anuluj"
          onConfirm={handleDeleteRoute}
          onCancel={() => setPendingDeleteRoute(null)}
        />
      )}
    </div>
  );
}
