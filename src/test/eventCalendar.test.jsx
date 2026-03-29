import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EventCalendar from "../components/events/EventCalendar";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
  },
}));

let appCalendarProps = null;

vi.mock("../api/api", () => ({ default: apiMock }));

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
    locale: "pl",
  }),
}));

vi.mock("../components/calendar/AppCalendar", () => ({
  default: (props) => {
    appCalendarProps = props;
    return (
      <button
        type="button"
        onClick={() =>
          props.onSelectSlot?.({
            start: new Date("2031-02-03T08:00:00"),
            end: new Date("2031-02-03T09:00:00"),
            action: "click",
          })
        }
      >
        tap-empty-slot
      </button>
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
            title: "mobile-test-event",
            description: "",
            startAt: "2031-02-03T08:00:00",
            endAt: null,
            location: null,
          })
        }
      >
        submit-event
      </button>
      <button type="button" onClick={onCancel}>
        cancel-event
      </button>
    </div>
  ),
}));

vi.mock("../components/events/EventPreviewModal", () => ({
  default: () => null,
}));

function mockMatchMedia(matches) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: "(max-width: 700px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("EventCalendar", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    appCalendarProps = null;
    apiMock.createEvent.mockResolvedValue({
      id: 901,
      title: "mobile-test-event",
      startAt: "2031-02-03T08:00:00",
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("shows mobile add button and opens form when clicked", async () => {
    window.matchMedia = mockMatchMedia(true);
    const onEventsChange = vi.fn();

    render(
      <EventCalendar
        events={[]}
        onEventsChange={onEventsChange}
        canManageEvents
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /\+ add event/i }));

    expect(screen.getByTestId("event-form")).toBeInTheDocument();
    expect(screen.getByTestId("seed-start-at")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("button", { name: "submit-event" }));

    await waitFor(() => {
      expect(apiMock.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ title: "mobile-test-event" }),
      );
      expect(onEventsChange).toHaveBeenCalled();
    });
  });

  it("opens form with selected date after calendar slot tap", () => {
    window.matchMedia = mockMatchMedia(false);

    render(
      <EventCalendar events={[]} canManageEvents onEventsChange={vi.fn()} />,
    );

    expect(appCalendarProps).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "tap-empty-slot" }));

    expect(screen.getByTestId("event-form")).toBeInTheDocument();
    expect(screen.getByTestId("seed-start-at").textContent).toContain(
      "2031-02-03",
    );
  });
});
