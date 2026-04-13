import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import { FullMap } from "../components/events/MapView";
import EventForm from "../components/events/EventForm";
import InboxSidebar from "../components/notifications/InboxSidebar";
import ShareUserModal from "../components/ui/ShareUserModal";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../components/events/events.css";

export default function MapPage() {
  const { hasPermission, isAuthenticated, user } = useAuth();
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
  const [mapResetKey, setMapResetKey] = useState(0);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareSearch, setShareSearch] = useState("");
  const [shareUsers, setShareUsers] = useState([]);
  const [shareUsersLoading, setShareUsersLoading] = useState(false);

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shareTarget) {
      return;
    }

    setShareUsersLoading(true);
    api
      .getShareableUsers({ page: 1, perPage: 50, search: shareSearch })
      .then((response) => {
        const users = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        setShareUsers(users);
      })
      .catch(() => setShareUsers([]))
      .finally(() => setShareUsersLoading(false));
  }, [shareTarget, shareSearch]);

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

  const handleResetMap = () => {
    setMapResetKey((prev) => prev + 1);
    setShowForm(false);
    setEditingEvent(null);
    setSeedLocation(null);
    setSeedTitle("");
  };

  const closeShareModal = () => {
    setShareTarget(null);
    setShareSearch("");
    setShareUsers([]);
  };

  const handleShareEvent = async (selectedUser) => {
    if (!shareTarget?.id || !selectedUser?.id) {
      return;
    }

    try {
      const updated = await api.shareEvent(shareTarget.id, selectedUser.id);
      setEvents((prev) =>
        prev.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      if (editingEvent?.id === updated.id) {
        setEditingEvent(updated);
      }
      closeShareModal();
    } catch (err) {
      alert(`Failed to share event: ${err.message}`);
    }
  };

  return (
    <div
      className="page-shell map-page-shell"
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
            <button
              type="button"
              className="map-filter-clear-btn"
              onClick={handleResetMap}
              title="Odśwież mapę, gdy przestanie odpowiadać"
              style={{ marginLeft: "auto" }}
            >
              Reset mapy
            </button>
          </div>
          <div className="map-full-container">
            <FullMap
              key={`full-map-${mapResetKey}`}
              events={events}
              canManageRoutes={canManageRoutes}
              canManageEvents={canManageEvents}
              currentUserId={user?.id ?? null}
              onCreateEventAtLocation={handleCreateEventAtLocation}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onShareEvent={setShareTarget}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <EventForm
          initial={editingEvent}
          seedLocation={seedLocation}
          seedTitle={seedTitle}
          canShare={editingEvent?.ownerId === user?.id}
          onShare={setShareTarget}
          onSave={handleSaveEvent}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
            setSeedLocation(null);
            setSeedTitle("");
          }}
        />
      )}

      <ShareUserModal
        isOpen={Boolean(shareTarget)}
        title="Udostępnij event"
        loading={shareUsersLoading}
        users={shareUsers}
        search={shareSearch}
        onSearchChange={setShareSearch}
        currentUserId={user?.id}
        alreadySharedUserIds={shareTarget?.sharedWithUserIds ?? []}
        onClose={closeShareModal}
        onConfirm={handleShareEvent}
      />
    </div>
  );
}
