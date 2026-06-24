import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import EventsSummary from "../components/events/EventsSummary";

const EVENTS = [
  {
    id: 1,
    title: "testy",
    description: "",
    startAt: "2030-06-29T02:00:00",
    endAt: "2030-07-01T01:59:00",
    location: {
      display_name: "Puck, powiat pucki, województwo pomorskie, 84-100, Polska",
      lat: 54.72,
      lon: 18.41,
    },
  },
];

const getEventsMock = vi.fn();

vi.mock("../api/api", () => ({
  default: {
    getEvents: (...args) => getEventsMock(...args),
  },
}));

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
  }),
}));

vi.mock("../components/events/EventPreviewModal", () => ({
  default: ({ event, onClose, onShowMap }) => (
    <div role="dialog">
      <div>{event.title}</div>
      <button type="button" onClick={() => onShowMap?.(event)}>
        Open full map
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock("../components/events/MapModal", () => ({
  default: ({ title, onClose }) => (
    <div role="dialog" aria-label="map-dialog">
      <div>{title}</div>
      <button type="button" onClick={onClose}>
        Close map
      </button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  getEventsMock.mockResolvedValue(EVENTS);
});

describe("EventsSummary", () => {
  it("replaces the preview with the full map when opening it", async () => {
    render(
      <MemoryRouter>
        <EventsSummary />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("testy")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /testy/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Open full map")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open full map" }));

    await waitFor(() => {
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      expect(
        screen.getByRole("dialog", { name: /map-dialog/i }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Open full map")).not.toBeInTheDocument();
    });
  });
});
