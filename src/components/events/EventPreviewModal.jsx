import React from "react";
import { useTranslation } from "../../context/TranslationContext";

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
}) {
  const { t } = useTranslation();

  if (!event) return null;

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div className="event-form-card" onClick={(e) => e.stopPropagation()}>
        <h2>{t("events.previewTitle", "Event preview")}</h2>

        <div className="event-form-group" style={{ marginBottom: "0.6rem" }}>
          <strong>{event.title || "-"}</strong>
        </div>

        <div className="event-form-group" style={{ marginBottom: "0.6rem" }}>
          <label>{t("events.previewStart", "Start")}</label>
          <div>{formatDateTime(event.startAt, locale)}</div>
        </div>

        <div className="event-form-group" style={{ marginBottom: "0.6rem" }}>
          <label>{t("events.previewEnd", "End")}</label>
          <div>{formatDateTime(event.endAt, locale)}</div>
        </div>

        <div className="event-form-group" style={{ marginBottom: "0.6rem" }}>
          <label>{t("events.previewLocation", "Location")}</label>
          <div>{event.location?.display_name || "-"}</div>
        </div>

        {event.description ? (
          <div className="event-form-group" style={{ marginBottom: "0.6rem" }}>
            <label>{t("events.form.descriptionLabel", "Description")}</label>
            <div>{event.description}</div>
          </div>
        ) : null}

        <div className="event-form-actions">
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
