import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CalendarPage from "../pages/CalendarPage";

const { apiMock, authMock } = vi.hoisted(() => ({
  apiMock: {
    getEvents: vi.fn(),
    createEvent: vi.fn(),
  },
  authMock: {
    hasPermission: vi.fn(),
  },
}));

let appCalendarProps = null;

vi.mock("../api/api", () => ({
  default: apiMock,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authMock,
}));

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
  }),
}));

vi.mock("../components/nav/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../components/notifications/InboxSidebar", () => ({
  default: () => <div data-testid="inbox-sidebar" />,
}));

vi.mock("../components/calendar/AppCalendar", () => ({
  default: (props) => {
    appCalendarProps = props;
    return (
      <div>
        <div data-testid="calendar-events-count">{props.events.length}</div>
        <button
          type="button"
          onClick={() =>
            props.onSelectSlot?.({
              start: new Date("2030-01-15T09:30:00"),
              end: new Date("2030-01-15T10:30:00"),
              action: "click",
            })
          }
        >
          select-calendar-day
        </button>
      </div>
    );
  },
}));

vi.mock("../components/events/EventForm", () => ({
  default: ({ seedStartAt, onSave, onCancel }) => (
    <div data-testid="event-form">
      <span data-testid="seed-start-at">
        {seedStartAt instanceof Date ? seedStartAt.toISOString() : ""}
      </span>
      <button
        type="button"
        onClick={() =>
          onSave({
            title: "Calendar event",
            description: "",
            startAt: "2030-01-15T09:30:00",
            endAt: null,
            location: null,
          })
        }
      >
        save-calendar-event
      </button>
      <button type="button" onClick={onCancel}>
        cancel-calendar-event
      </button>
    </div>
  ),
}));

describe("CalendarPage", () => {
  beforeEach(() => {
    appCalendarProps = null;
    apiMock.getEvents.mockReset();
    apiMock.createEvent.mockReset();
    apiMock.getEvents.mockResolvedValue([]);
    apiMock.createEvent.mockImplementation(async (payload) => ({
      id: 701,
      ...payload,
    }));
    authMock.hasPermission.mockReset();
    authMock.hasPermission.mockImplementation(
      (permission) => permission === "events.manage",
    );
  });

  it("creates an event after selecting an empty calendar slot", async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(apiMock.getEvents).toHaveBeenCalled();
      expect(appCalendarProps).not.toBeNull();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "select-calendar-day" }),
    );

    expect(screen.getByTestId("event-form")).toBeInTheDocument();
    expect(screen.getByTestId("seed-start-at").textContent).toContain(
      "2030-01-15",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "save-calendar-event" }),
    );

    await waitFor(() => {
      expect(apiMock.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Calendar event",
          startAt: "2030-01-15T09:30:00",
        }),
      );
    });
  });

  it("opens event form with selected date when a calendar day is clicked", async () => {
    render(<CalendarPage />);

    await waitFor(() => {
      expect(appCalendarProps).not.toBeNull();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "select-calendar-day" }),
    );

    expect(screen.getByTestId("event-form")).toBeInTheDocument();
    expect(screen.getByTestId("seed-start-at").textContent).toContain(
      "2030-01-15",
    );
  });
});
