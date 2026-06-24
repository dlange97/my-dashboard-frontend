import React, { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { getSafeMapLocation } from "./coords";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(id);
  }, [map]);

  return null;
}

export default function EventLocationMap({ location, title, height = 180 }) {
  const safeLocation = getSafeMapLocation(location);

  return (
    <MapContainer
      center={[safeLocation.lat, safeLocation.lon]}
      zoom={13}
      style={{ height, width: "100%", borderRadius: "10px" }}
      scrollWheelZoom={false}
      dragging={true}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[safeLocation.lat, safeLocation.lon]}>
        <Popup>{title || safeLocation.display_name || "Event location"}</Popup>
      </Marker>
      <MapResizer />
    </MapContainer>
  );
}
