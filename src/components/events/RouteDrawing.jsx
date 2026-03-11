import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import { getDistanceInMeters, polylineDistance } from "../../utils/routeUtils";

async function ensureLeafletDrawLoaded() {
  if (typeof window === "undefined") return;
  if (!L.Control?.Draw) {
    await import("leaflet-draw");
  }
}

export default function RouteDrawing({
  onRouteSave,
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
    if (!drawLayer || drawLayer.getLayers().length === 0) {
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

    if (features.length === 0) {
      setError("Trasa musi zawierać minimum dwa punkty.");
      return;
    }

    const payload = {
      name: routeName.trim(),
      description: routeDescription.trim(),
      geoJson: {
        type: "FeatureCollection",
        features,
      },
      distanceMeters: Math.round(totalDistance),
      durationMinutes: Math.max(1, Math.ceil(totalDistance / 1400)),
      waypoints,
    };

    try {
      setSaving(true);
      const saved = await onRouteSave(payload);

      setRouteName("");
      setRouteDescription("");
      setShowForm(false);
      drawLayer.clearLayers();

      if (saved) {
        setSavedRoutes((prev) => [...prev, saved]);
      }
    } catch (err) {
      setError(err.message || "Nie udało się zapisać trasy.");
    } finally {
      setSaving(false);
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
                  >
                    <strong>{route.name}</strong>
                    <div className="route-stats">
                      📏 {((route.distanceMeters ?? 0) / 1000).toFixed(2)} km |
                      ⏱️ {route.durationMinutes ?? 0} min
                    </div>
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
              }}
              disabled={saving}
            >
              ← Wróć
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
