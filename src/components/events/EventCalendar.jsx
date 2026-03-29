import React, { useState } from "react";
import AppCalendar from "../calendar/AppCalendar";
import EventForm from "./EventForm";
import EventPreviewModal from "./EventPreviewModal";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";

export default function EventCalendar({
  events,
  onEventsChange,
  canManageEvents = false,
  compact = false,
  className = "",
}) {
  const { t, locale } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [seedStartAt, setSeedStartAt] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(max-width: 700px)").matches;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia("(max-width: 700px)");
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const openCreate = (start = null) => {
    if (!canManageEvents) {
      return;
    }
    setEditingEvent(null);
    setSeedStartAt(start);
    setShowForm(true);
  };

  const openPreview = (event) => {
    if (!event) return;
    setPreviewEvent(event);
  };

  const handleSave = async (payload) => {
    try {
      if (editingEvent?.id) {
        const updated = await api.updateEvent(editingEvent.id, payload);
        onEventsChange?.((prev) =>
          (prev || []).map((entry) =>
            entry.id === updated.id ? updated : entry,
          ),
        );
      } else {
        const created = await api.createEvent(payload);
        onEventsChange?.((prev) => [...(prev || []), created]);
      }
    } catch (err) {
      alert(`${t("events.saveError", "Failed to save event")}: ${err.message}`);
      return;
    }

    setShowForm(false);
    setEditingEvent(null);
    setSeedStartAt(null);
  };

  return (
    <>
      {isMobile && canManageEvents && (
        <button
          type="button"
          className="event-calendar-mobile-add"
          onClick={() => openCreate(null)}
        >
          {t("events.addButton", "+ Add Event")}
        </button>
      )}

      <AppCalendar
        events={events}
        compact={compact}
        className={className}
        onSelectEvent={openPreview}
        onSelectSlot={({ start }) => openCreate(start)}
      />

      {previewEvent && (
        <EventPreviewModal
          event={previewEvent}
          locale={locale}
          canManageEvents={canManageEvents}
          onClose={() => setPreviewEvent(null)}
          onEdit={() => {
            setEditingEvent(previewEvent);
            setPreviewEvent(null);
            setShowForm(true);
          }}
        />
      )}

      {showForm && (
        <EventForm
          initial={editingEvent}
          seedStartAt={seedStartAt}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingEvent(null);
            setSeedStartAt(null);
          }}
        />
      )}
    </>
  );
}
