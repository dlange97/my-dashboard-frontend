import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import { FullMap } from "../components/events/MapView";
import EventForm from "../components/events/EventForm";
import InboxSidebar from "../components/notifications/InboxSidebar";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../components/events/events.css";

export default function MapPage() {
  const { hasPermission, isAuthenticated } = useAuth();
  // All authenticated users can manage routes; fallback covers stale JWTs issued
  // before routes.manage was added to ROLE_USER.
  const canManageRoutes = hasPermission("routes.manage") || isAuthenticated;
  // Keep event-creation UI available for logged users even when token permissions
  // are stale; API still enforces authorization server-side.
  const canManageEvents = hasPermission("events.manage") || isAuthenticated;
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [seedLocation, setSeedLocation] = useState(null);
  const [seedTitle, setSeedTitle] = useState("");

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data ?? []))
      .catch(() => {});
  }, []);

  const handleCreateEventAtLocation = (location) => {
    setEditingEvent(null);
    setSeedLocation(location);
    setSeedTitle(location?.suggestedTitle ?? "");
    setShowForm(true);
  };

  const handleEditEvent = (event) => {
    setSeedLocation(null);
    setSeedTitle("");
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDeleteEvent = async (event) => {
    if (!event?.id) return;

    await api.deleteEvent(event.id);
    setEvents((prev) => prev.filter((entry) => entry.id !== event.id));
  };

  const handleSaveEvent = async (payload) => {
    const normalizedPayload =
      !payload.location && seedLocation
        ? { ...payload, location: seedLocation }
        : payload;

    if (editingEvent?.id) {
      const updated = await api.updateEvent(editingEvent.id, normalizedPayload);
      setEvents((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
    } else {
      const created = await api.createEvent(normalizedPayload);
      setEvents((prev) => [...prev, created]);
    }

    setShowForm(false);
    setEditingEvent(null);
    setSeedLocation(null);
    setSeedTitle("");
  };

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
            <FullMap
              events={events}
              canManageRoutes={canManageRoutes}
              canManageEvents={canManageEvents}
              onCreateEventAtLocation={handleCreateEventAtLocation}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <EventForm
          initial={editingEvent}
          seedLocation={seedLocation}
          seedTitle={seedTitle}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
            setSeedLocation(null);
            setSeedTitle("");
          }}
        />
      )}
    </div>
  );
}
