import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import EventCalendar from "../components/events/EventCalendar";
import EventForm from "../components/events/EventForm";
import EventItem from "../components/events/EventItem";
import { MapModal } from "../components/events/MapView";
import InboxSidebar from "../components/notifications/InboxSidebar";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "../components/events/events.css";

export default function EventsPage() {
  const { hasPermission } = useAuth();
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
      alert(`Failed to save event: ${err.message}`);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Delete "${event.title}"?`)) return;
    try {
      await api.deleteEvent(event.id);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main events-page">
          <div className="events-page-header">
            <h1>📅 My Events</h1>
            <div className="events-view-tabs">
              <button
                className={`tab-btn${view === "list" ? " active" : ""}`}
                onClick={() => setView("list")}
              >
                List
              </button>
              <button
                className={`tab-btn${view === "calendar" ? " active" : ""}`}
                onClick={() => setView("calendar")}
              >
                Calendar
              </button>
            </div>
            <button
              className="add-event-btn"
              disabled={!canManageEvents}
              title={
                canManageEvents
                  ? "Add Event"
                  : "Missing permission: events.manage"
              }
              onClick={() => {
                setEditingEvent(null);
                setShowForm(true);
              }}
            >
              + Add Event
            </button>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : view === "calendar" ? (
            <EventCalendar events={events} onSelectEvent={handleEdit} />
          ) : sorted.length === 0 ? (
            <div className="event-list-empty">
              No events yet. Click <strong>+ Add Event</strong> to create one.
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
            <MapModal
              location={mapEvent.location}
              title={mapEvent.title}
              onClose={() => setMapEvent(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
