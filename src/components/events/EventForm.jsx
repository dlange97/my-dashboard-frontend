import React, { useEffect, useState } from "react";
import LocationPicker from "./LocationPicker";
import { useTranslation } from "../../context/TranslationContext";

const EMPTY = {
  title: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: null,
};

function formatSeedDate(value) {
  if (!value) {
    return { date: "", time: "" };
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: "", time: "" };
  }

  return {
    date: date.toISOString().slice(0, 10),
    time:
      date.getHours() === 0 && date.getMinutes() === 0
        ? ""
        : date.toISOString().slice(11, 16),
  };
}

export default function EventForm({
  initial,
  seedLocation = null,
  seedTitle = "",
  seedStartAt = null,
  onSave,
  onCancel,
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    return {
      title: initial.title ?? "",
      description: initial.description ?? "",
      startDate: initial.startAt ? initial.startAt.slice(0, 10) : "",
      startTime: initial.startAt ? initial.startAt.slice(11, 16) : "",
      endDate: initial.endAt ? initial.endAt.slice(0, 10) : "",
      endTime: initial.endAt ? initial.endAt.slice(11, 16) : "",
      location: initial.location ?? null,
    };
  });

  useEffect(() => {
    if (initial) {
      return;
    }

    const seededStart = formatSeedDate(seedStartAt);

    setForm((prev) => ({
      ...prev,
      location: seedLocation ?? prev.location,
      title: prev.title.trim() ? prev.title : seedTitle,
      startDate: prev.startDate || seededStart.date,
      startTime: prev.startTime || seededStart.time,
    }));
  }, [initial, seedLocation, seedStartAt, seedTitle]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      startAt:
        form.startDate +
        (form.startTime ? `T${form.startTime}:00` : "T00:00:00"),
      endAt: form.endDate
        ? form.endDate + (form.endTime ? `T${form.endTime}:00` : "T23:59:00")
        : null,
      location: form.location,
    });
  };

  return (
    <div className="event-form-overlay" onClick={onCancel}>
      <div className="event-form-card" onClick={(e) => e.stopPropagation()}>
        <h2>
          {initial
            ? t("events.form.editTitle", "Edit Event")
            : t("events.form.createTitle", "New Event")}
        </h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="event-form-group">
            <label>{t("events.form.titleLabel", "Title *")}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("events.form.titlePlaceholder", "Event title")}
              required
              autoFocus
            />
          </div>

          <div className="event-form-group">
            <label>{t("events.form.descriptionLabel", "Description")}</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("events.form.descriptionPlaceholder", "Optional details…")}
            />
          </div>

          <div className="event-form-row">
            <div className="event-form-group">
              <label>{t("events.form.startDateLabel", "Start Date *")}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                required
              />
            </div>
            <div className="event-form-group">
              <label>{t("events.form.startTimeLabel", "Start Time")}</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </div>
          </div>

          <div className="event-form-row">
            <div className="event-form-group">
              <label>{t("events.form.endDateLabel", "End Date")}</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                min={form.startDate}
              />
            </div>
            <div className="event-form-group">
              <label>{t("events.form.endTimeLabel", "End Time")}</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
              />
            </div>
          </div>

          <div className="event-form-group">
            <label>{t("events.form.locationLabel", "Location (Poland)")}</label>
            <LocationPicker
              value={form.location}
              onChange={(loc) => set("location", loc)}
            />
          </div>

          <div className="event-form-actions">
            <button
              type="button"
              className="event-btn-secondary"
              onClick={onCancel}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button type="submit" className="event-btn-primary">
              {initial
                ? t("events.form.saveChanges", "Save Changes")
                : t("events.add", "Add Event")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
