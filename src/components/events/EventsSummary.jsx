import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import EventPreviewModal from "./EventPreviewModal";
import MapModal from "./MapModal";
import { hasValidCoords } from "./coords";

export default function EventsSummary() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapEvent, setMapEvent] = useState(null);

  useEffect(() => {
    api
      .getEvents()
      .then((data) => {
        const upcoming = (data ?? [])
          .filter((e) => new Date(e.startAt) >= new Date())
          .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
          .slice(0, 4);
        setEvents(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="summary-card">
        <div className="summary-card-header">
          <div className="summary-card-title">
            {t("events.pageTitle", "My Events")}
          </div>
          <Link to="/events" className="summary-go-link">
            {t("events.viewAll", "View all")} →
          </Link>
        </div>

        {loading ? (
          <div className="empty-state">{t("common.loading", "Loading…")}</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            {t("events.noUpcoming", "No upcoming events.")}
          </div>
        ) : (
          <div className="events-summary-list">
            {events.map((ev) => (
              <button
                key={ev.id}
                className="events-summary-item events-summary-btn"
                onClick={() => setSelectedEvent(ev)}
                type="button"
              >
                <div className="events-summary-dot" />
                <div className="events-summary-info">
                  <div className="events-summary-title">{ev.title}</div>
                  <div className="events-summary-date">
                    {format(new Date(ev.startAt), "d MMM yyyy, HH:mm", {
                      locale: pl,
                    })}
                  </div>
                </div>
                {hasValidCoords(ev.location) && (
                  <span className="events-summary-pin" title="Has location">
                    📍
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventPreviewModal
          event={selectedEvent}
          locale="pl"
          canManageEvents={false}
          onClose={() => {
            setSelectedEvent(null);
            setMapEvent(null);
          }}
          onShowMap={(event) => {
            setMapEvent(event ?? selectedEvent);
            setSelectedEvent(null);
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
    </>
  );
}
