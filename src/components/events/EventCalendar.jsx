import React from "react";
import AppCalendar from "../calendar/AppCalendar";

export default function EventCalendar({ events, onSelectEvent }) {
  return <AppCalendar events={events} onSelectEvent={onSelectEvent} />;
}
