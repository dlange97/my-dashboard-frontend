import React, { useState } from "react";
import LocationPicker from "./LocationPicker";

const EMPTY = {
  title: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: null,
};

export default function EventForm({ initial, onSave, onCancel }) {
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
        <h2>{initial ? "Edit Event" : "New Event"}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="event-form-group">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Event title"
              required
              autoFocus
            />
          </div>

          <div className="event-form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional details…"
            />
          </div>

          <div className="event-form-row">
            <div className="event-form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                required
              />
            </div>
            <div className="event-form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
              />
            </div>
          </div>

          <div className="event-form-row">
            <div className="event-form-group">
              <label>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                min={form.startDate}
              />
            </div>
            <div className="event-form-group">
              <label>End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
              />
            </div>
          </div>

          <div className="event-form-group">
            <label>Location (Poland)</label>
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
              Cancel
            </button>
            <button type="submit" className="event-btn-primary">
              {initial ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
