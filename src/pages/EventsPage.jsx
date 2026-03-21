import React, { Suspense, lazy, useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import EventCalendar from "../components/events/EventCalendar";
import EventForm from "../components/events/EventForm";
import EventItem from "../components/events/EventItem";
import InboxSidebar from "../components/notifications/InboxSidebar";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";
import "../components/events/events.css";

const MapModal = lazy(() => import("../components/events/MapModal"));

export default function EventsPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const canManageEvents = hasPermission("events.manage");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [mapEvent, setMapEvent] = useState(null);

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...events].sort(
    (a, b) => new Date(a.startAt) - new Date(b.startAt),
  );

  const handleSave = async (payload) => {
    try {
      if (editingEvent) {
        const updated = await api.updateEvent(editingEvent.id, payload);
        setEvents((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
      } else {
        const created = await api.createEvent(payload);
        setEvents((prev) => [...prev, created]);
      }
    } catch (err) {
      alert(`${t("events.saveError", "Failed to save event")}: ${err.message}`);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`${t("events.deleteConfirm", "Delete event")}: "${event.title}"?`)) return;
    try {
      await api.deleteEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err) {
      alert(`${t("events.deleteError", "Failed to delete event")}: ${err.message}`);
    }
  };

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main events-page">
          <div className="events-page-header">
            <h1>{t("events.pageTitle", "📅 My Events")}</h1>
            <div className="events-view-tabs">
              <button
                className={`tab-btn${view === "list" ? " active" : ""}`}
                onClick={() => setView("list")}
              >
                {t("events.viewList", "List")}
              </button>
              <button
                className={`tab-btn${view === "calendar" ? " active" : ""}`}
                onClick={() => setView("calendar")}
              >
                {t("events.viewCalendar", "Calendar")}
              </button>
            </div>
            <button
              className="add-event-btn"
              disabled={!canManageEvents}
              title={
                canManageEvents
                  ? t("events.add", "Add Event")
                  : t("events.missingManagePermission", "Missing permission: events.manage")
              }
              onClick={() => {
                setEditingEvent(null);
                setShowForm(true);
              }}
            >
              {t("events.addButton", "+ Add Event")}
            </button>
          </div>

          {loading ? (
            <p>{t("common.loading", "Loading…")}</p>
          ) : view === "calendar" ? (
            <EventCalendar events={events} onSelectEvent={handleEdit} />
          ) : sorted.length === 0 ? (
            <div className="event-list-empty">
              {t("events.empty", "No events yet. Click")} <strong>{t("events.addButton", "+ Add Event")}</strong> {t("events.emptySuffix", "to create one.")}
            </div>
          ) : (
            <div className="event-list">
              {sorted.map((ev) => (
                <EventItem
                  key={ev.id}
                  event={ev}
                  canManage={canManageEvents}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewMap={setMapEvent}
                />
              ))}
            </div>
          )}

          {showForm && (
            <EventForm
              initial={editingEvent}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}
            />
          )}

          {mapEvent && (
            <Suspense fallback={null}>
              <MapModal
                location={mapEvent.location}
                title={mapEvent.title}
                onClose={() => setMapEvent(null)}
              />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
