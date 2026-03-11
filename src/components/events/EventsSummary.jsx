import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import api from "../../api/api";

export default function EventsSummary() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-events">📅</span>
          My Events
        </div>
        <Link to="/events" className="summary-go-link">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : events.length === 0 ? (
        <div className="empty-state">No upcoming events.</div>
      ) : (
        <div className="events-summary-list">
          {events.map((ev) => (
            <div key={ev.id} className="events-summary-item">
              <div className="events-summary-dot" />
              <div className="events-summary-info">
                <div className="events-summary-title">{ev.title}</div>
                <div className="events-summary-date">
                  {format(new Date(ev.startAt), "d MMM yyyy, HH:mm", {
                    locale: pl,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
