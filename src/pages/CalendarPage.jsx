import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import InboxSidebar from "../components/notifications/InboxSidebar";
import EventCalendar from "../components/events/EventCalendar";
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

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main events-page">
          <div className="events-page-header">
            <h1>{t("calendar.pageTitle", "Calendar")}</h1>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
              {canManageEvents
                ? t(
                    "calendar.clickEmptyToCreate",
                    "Click empty slot to create event",
                  )
                : t(
                    "events.missingManagePermission",
                    "Missing permission: events.manage",
                  )}
            </span>
          </div>

          {loading ? (
            <p>{t("common.loading", "Loading…")}</p>
          ) : (
            <EventCalendar
              events={events}
              onEventsChange={setEvents}
              canManageEvents={canManageEvents}
            />
          )}
        </main>
      </div>
    </div>
  );
}
