import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import { FullMap } from "../components/events/MapView";
import InboxSidebar from "../components/notifications/InboxSidebar";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../components/events/events.css";

export default function MapPage() {
  const { hasPermission, isAuthenticated } = useAuth();
  // All authenticated users can manage routes; fallback covers stale JWTs issued
  // before routes.manage was added to ROLE_USER.
  const canManageRoutes = hasPermission("routes.manage") || isAuthenticated;
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data ?? []))
      .catch(() => {});
  }, []);

  return (
    <div
      className="page-shell"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <div className="map-page app-shell-main">
          <div className="map-page-header">
            <h1>🗺 Map</h1>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              {events.filter((e) => e.location?.lat).length} event(s) on map
            </span>
          </div>
          <div className="map-full-container">
            <FullMap events={events} canManageRoutes={canManageRoutes} />
          </div>
        </div>
      </div>
    </div>
  );
}
