import React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

function formatEventDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return { day: format(d, "d"), month: format(d, "MMM", { locale: pl }) };
}

export default function EventItem({
  event,
  onEdit,
  onDelete,
  onViewMap,
  canManage = true,
}) {
  const start = formatEventDate(event.startAt);

  return (
    <div className="event-item">
      <div className="event-item-left">
        {start && (
          <div className="event-date-badge">
            <span className="event-date-day">{start.day}</span>
            <span className="event-date-month">{start.month}</span>
          </div>
        )}
        <div className="event-info">
          <p className="event-title">{event.title}</p>
          <div className="event-meta">
            {event.startAt && (
              <span className="event-meta-item">
                🕐 {format(new Date(event.startAt), "HH:mm")}
                {event.endAt && ` – ${format(new Date(event.endAt), "HH:mm")}`}
              </span>
            )}
            {event.location?.display_name && (
              <span className="event-meta-item">
                📍 {event.location.display_name.split(",")[0]}
              </span>
            )}
          </div>
          {event.description && (
            <p className="event-description">{event.description}</p>
          )}
        </div>
      </div>
      <div className="event-item-actions">
        {event.location && (
          <button
            className="event-action-btn map-btn"
            onClick={() => onViewMap(event)}
          >
            🗺 View Map
          </button>
        )}
        {canManage && (
          <>
            <button className="event-action-btn" onClick={() => onEdit(event)}>
              Edit
            </button>
            <button
              className="event-action-btn danger"
              onClick={() => onDelete(event)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
