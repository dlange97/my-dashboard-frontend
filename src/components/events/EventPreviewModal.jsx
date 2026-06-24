import React from "react";
import { useTranslation } from "../../context/TranslationContext";
import { hasValidCoords } from "./coords";
import EventLocationMap from "./EventLocationMap";

function formatDateTime(value, locale) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale === "pl" ? "pl-PL" : "en-US");
}

export default function EventPreviewModal({
  event,
  locale,
  canManageEvents = false,
  onClose,
  onEdit,
  onShowMap,
}) {
  const { t } = useTranslation();

  if (!event) return null;

  const hasLocation = hasValidCoords(event.location);

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div
        className="event-form-card event-preview-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480 }}
      >
        {/* Header */}
        <div className="event-preview-header">
          <div className="event-preview-type-dot" />
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
            {event.title || "-"}
          </h2>
          <button
            className="map-close-btn"
            onClick={onClose}
            aria-label="Close"
            style={{ marginLeft: "auto" }}
          >
            ✕
          </button>
        </div>

        {/* Time */}
        <div className="event-preview-row">
          <span className="event-preview-icon">🕐</span>
          <div>
            <div className="event-preview-label">
              {t("events.previewStart", "Start")}
            </div>
            <div className="event-preview-value">
              {formatDateTime(event.startAt, locale)}
            </div>
          </div>
        </div>

        {event.endAt && (
          <div className="event-preview-row">
            <span className="event-preview-icon">🏁</span>
            <div>
              <div className="event-preview-label">
                {t("events.previewEnd", "End")}
              </div>
              <div className="event-preview-value">
                {formatDateTime(event.endAt, locale)}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="event-preview-row">
            <span className="event-preview-icon">📝</span>
            <div>
              <div className="event-preview-label">
                {t("events.form.descriptionLabel", "Description")}
              </div>
              <div className="event-preview-value">{event.description}</div>
            </div>
          </div>
        )}

        {/* Location + minimap */}
        {hasLocation && (
          <div className="event-preview-map-section">
            <div
              className="event-preview-row"
              style={{ marginBottom: "0.5rem" }}
            >
              <span className="event-preview-icon">📍</span>
              <div>
                <div className="event-preview-label">
                  {t("events.previewLocation", "Location")}
                </div>
                <div className="event-preview-value">
                  {event.location?.display_name ||
                    `${lat?.toFixed(4)}, ${lon?.toFixed(4)}`}
                </div>
              </div>
            </div>
            <div className="event-preview-minimap">
              <EventLocationMap location={event.location} title={event.title} />
              {onShowMap && (
                <button
                  className="event-preview-expand-map"
                  onClick={() => onShowMap(event)}
                  type="button"
                >
                  🗺 {t("events.openFullMap", "Open full map")}
                </button>
              )}
            </div>
          </div>
        )}

        {!hasLocation && event.location?.display_name && (
          <div className="event-preview-row">
            <span className="event-preview-icon">📍</span>
            <div>
              <div className="event-preview-label">
                {t("events.previewLocation", "Location")}
              </div>
              <div className="event-preview-value">
                {event.location.display_name}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="event-form-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="event-btn-secondary"
            onClick={onClose}
          >
            {t("common.close", "Close")}
          </button>
          {canManageEvents && (
            <button
              type="button"
              className="event-btn-primary"
              onClick={onEdit}
            >
              {t("common.edit", "Edit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
