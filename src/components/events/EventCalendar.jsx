import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { pl },
});

const MESSAGES = {
  allDay: "Cały dzień",
  previous: "‹",
  next: "›",
  today: "Dziś",
  month: "Miesiąc",
  week: "Tydzień",
  day: "Dzień",
  agenda: "Agenda",
  date: "Data",
  time: "Godzina",
  event: "Wydarzenie",
  noEventsInRange: "Brak wydarzeń w tym okresie.",
};

export default function EventCalendar({ events, onSelectEvent }) {
  const calEvents = useMemo(
    () =>
      events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        start: new Date(ev.startAt),
        end: ev.endAt ? new Date(ev.endAt) : new Date(ev.startAt),
        resource: ev,
      })),
    [events],
  );

  return (
    <div className="rbc-calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={calEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 520 }}
        culture="pl"
        messages={MESSAGES}
        onSelectEvent={(e) => onSelectEvent(e.resource)}
        popup
      />
    </div>
  );
}
