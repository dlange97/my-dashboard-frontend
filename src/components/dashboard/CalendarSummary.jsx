import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import EventCalendar from "../events/EventCalendar";
import { useTranslation } from "../../context/TranslationContext";
import { useAuth } from "../../context/AuthContext";

export default function CalendarSummary() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
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

  const currentMonthEvents = useMemo(() => {
    const now = new Date();
    return events.filter((event) => {
      const start = new Date(event.startAt);
      return (
        start.getMonth() === now.getMonth() &&
        start.getFullYear() === now.getFullYear()
      );
    });
  }, [events]);

  return (
    <div className="summary-card summary-card-calendar">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-calendar">🗓️</span>
          {t("dashboard.calendarTitle", "Calendar")}
        </div>
        <Link to="/calendar" className="summary-go-link">
          {t("dashboard.openCalendar", "Open calendar")} →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : (
        <>
          <div className="calendar-summary-note">
            {t("dashboard.calendarMonthCount", "Events this month")}:{" "}
            {currentMonthEvents.length}
          </div>
          <EventCalendar
            events={events}
            onEventsChange={setEvents}
            canManageEvents={canManageEvents}
            compact
            className="calendar-summary-calendar"
          />
        </>
      )}
    </div>
  );
}
