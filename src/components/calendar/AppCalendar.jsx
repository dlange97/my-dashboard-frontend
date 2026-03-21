import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import { useTranslation } from "../../context/TranslationContext";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date, options) => startOfWeek(date, { ...options, weekStartsOn: 1 }),
  getDay,
  locales: { en: enUS, pl },
});

export default function AppCalendar({
  events,
  onSelectEvent,
  onSelectSlot,
  compact = false,
  className = "",
}) {
  const { t, locale } = useTranslation();

  const calendarEvents = useMemo(
    () =>
      (events ?? []).map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startAt),
        end: event.endAt ? new Date(event.endAt) : new Date(event.startAt),
        resource: event,
      })),
    [events],
  );

  const messages = useMemo(
    () => ({
      allDay: t("calendar.allDay", "All day"),
      previous: t("calendar.previous", "Previous"),
      next: t("calendar.next", "Next"),
      today: t("calendar.today", "Today"),
      month: t("calendar.month", "Month"),
      week: t("calendar.week", "Week"),
      day: t("calendar.day", "Day"),
      agenda: t("calendar.agenda", "Agenda"),
      date: t("calendar.date", "Date"),
      time: t("calendar.time", "Time"),
      event: t("calendar.event", "Event"),
      noEventsInRange: t("calendar.emptyRange", "No events in this range."),
    }),
    [t],
  );

  return (
    <div
      className={`app-calendar-wrap ${compact ? "app-calendar-wrap-compact" : ""} ${className}`.trim()}
    >
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: compact ? 340 : 560 }}
        culture={locale === "pl" ? "pl" : "en"}
        messages={messages}
        selectable={Boolean(onSelectSlot) && !compact}
        onSelectEvent={
          onSelectEvent ? (selected) => onSelectEvent(selected.resource) : undefined
        }
        onSelectSlot={
          onSelectSlot ? ({ start, end, action }) => onSelectSlot({ start, end, action }) : undefined
        }
        popup
      />
    </div>
  );
}