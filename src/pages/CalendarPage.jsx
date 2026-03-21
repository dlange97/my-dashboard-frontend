import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import InboxSidebar from "../components/notifications/InboxSidebar";
import AppCalendar from "../components/calendar/AppCalendar";
import EventForm from "../components/events/EventForm";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";
import "../components/events/events.css";

export default function CalendarPage() {
  const { hasPermission } = useAuth();
  const { t } = useTranslation();
  const canManageEvents = hasPermission("events.manage");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [seedStartAt, setSeedStartAt] = useState(null);

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpenCreate = (date = null) => {
    if (!canManageEvents) {
      return;
    }

    setSeedStartAt(date);
    setShowForm(true);
  };

  const handleSave = async (payload) => {
    try {
      const created = await api.createEvent(payload);
      setEvents((prev) => [...prev, created]);
    } catch (err) {
      alert(`${t("events.saveError", "Failed to save event")}: ${err.message}`);
      return;
    }

    setShowForm(false);
    setSeedStartAt(null);
  };

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main events-page">
          <div className="events-page-header">
            <h1>{t("calendar.pageTitle", "Calendar")}</h1>
            <button
              type="button"
              className="add-event-btn"
              disabled={!canManageEvents}
              title={
                canManageEvents
                  ? t("events.add", "Add Event")
                  : t("events.missingManagePermission", "Missing permission: events.manage")
              }
              onClick={() => handleOpenCreate()}
            >
              {t("events.addButton", "+ Add Event")}
            </button>
          </div>

          {loading ? (
            <p>{t("common.loading", "Loading…")}</p>
          ) : (
            <AppCalendar
              events={events}
              onSelectSlot={({ start }) => handleOpenCreate(start)}
            />
          )}

          {showForm && (
            <EventForm
              seedStartAt={seedStartAt}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setSeedStartAt(null);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}