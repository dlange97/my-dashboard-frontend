import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import MapPage from "../pages/MapPage";

let fullMapLastProps = null;
let fullMapMountCount = 0;
let fullMapUnmountCount = 0;

const { apiMock, authMock } = vi.hoisted(() => ({
  apiMock: {
    getEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
  authMock: {
    hasPermission: vi.fn(),
    isAuthenticated: true,
  },
}));

vi.mock("../components/nav/NavBar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("../components/notifications/InboxSidebar", () => ({
  default: () => <div data-testid="inbox" />,
}));

vi.mock("../components/events/MapView", () => ({
  FullMap: (props) => {
    React.useEffect(() => {
      fullMapMountCount += 1;

      return () => {
        fullMapUnmountCount += 1;
      };
    }, []);

    fullMapLastProps = props;

    return (
      <button
        type="button"
        onClick={() =>
          props.onCreateEventAtLocation?.({
            lat: 52.2297,
            lon: 21.0122,
            display_name: "Warszawa",
            suggestedTitle: "Event: Warszawa",
          })
        }
      >
        simulate-map-click
      </button>
    );
  },
}));

vi.mock("../components/events/EventForm", () => ({
  default: ({ initial, seedLocation, seedTitle, onSave }) => (
    <div data-testid="event-form">
      <span data-testid="event-form-mode">{initial ? "edit" : "new"}</span>
      <span data-testid="event-form-seed-title">{seedTitle ?? ""}</span>
      <span data-testid="event-form-seed-location">
        {seedLocation?.display_name ?? ""}
      </span>
      <button
        type="button"
        onClick={() =>
          onSave?.({
            title: seedTitle || "Nowy event",
            description: "",
            startAt: "2030-01-01T10:00:00",
            endAt: null,
            location: null,
          })
        }
      >
        submit-event-form
      </button>
    </div>
  ),
}));

vi.mock("../api/api", () => ({
  default: apiMock,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => authMock,
}));

describe("MapPage", () => {
  beforeEach(() => {
    fullMapLastProps = null;
    fullMapMountCount = 0;
    fullMapUnmountCount = 0;
    apiMock.getEvents.mockReset();
    apiMock.createEvent.mockReset();
    apiMock.updateEvent.mockReset();
    apiMock.deleteEvent.mockReset();
    apiMock.getEvents.mockResolvedValue([]);
    apiMock.createEvent.mockImplementation(async (payload) => ({
      id: 501,
      ...payload,
    }));
    authMock.hasPermission.mockReset();
    authMock.hasPermission.mockReturnValue(true);
    authMock.isAuthenticated = true;
  });

  it("opens event form when location callback comes from map", async () => {
    render(<MapPage />);

    await waitFor(() => {
      expect(fullMapLastProps).not.toBeNull();
      expect(fullMapLastProps.canManageEvents).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "simulate-map-click" }));

    expect(screen.getByTestId("event-form-mode")).toHaveTextContent("new");
    expect(screen.getByTestId("event-form-seed-title")).toHaveTextContent(
      "Event: Warszawa",
    );
    expect(screen.getByTestId("event-form-seed-location")).toHaveTextContent(
      "Warszawa",
    );
  });

  it("opens event form when location callback comes from point action", async () => {
    render(<MapPage />);

    await waitFor(() => {
      expect(fullMapLastProps).not.toBeNull();
    });

    await act(async () => {
      fullMapLastProps.onCreateEventAtLocation?.({
        lat: 50.06143,
        lon: 19.93658,
        display_name: "Krakow - Rynek",
        suggestedTitle: "Event: Krakow - Rynek",
      });
    });

    expect(screen.getByTestId("event-form-mode")).toHaveTextContent("new");
    expect(screen.getByTestId("event-form-seed-title")).toHaveTextContent(
      "Event: Krakow - Rynek",
    );
    expect(screen.getByTestId("event-form-seed-location")).toHaveTextContent(
      "Krakow - Rynek",
    );
  });

  it("creates event from map seed location and updates map data", async () => {
    render(<MapPage />);

    await waitFor(() => {
      expect(fullMapLastProps).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "simulate-map-click" }));
    fireEvent.click(screen.getByRole("button", { name: "submit-event-form" }));

    await waitFor(() => {
      expect(apiMock.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Event: Warszawa",
          location: expect.objectContaining({
            lat: 52.2297,
            lon: 21.0122,
            display_name: "Warszawa",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("1 event(s) on map")).toBeInTheDocument();
    });

    expect(fullMapLastProps.events).toHaveLength(1);
  });

  it("creates event from point seed location and updates map data", async () => {
    render(<MapPage />);

    await waitFor(() => {
      expect(fullMapLastProps).not.toBeNull();
    });

    await act(async () => {
      fullMapLastProps.onCreateEventAtLocation?.({
        lat: 50.06143,
        lon: 19.93658,
        display_name: "Krakow - Rynek",
        suggestedTitle: "Event: Krakow - Rynek",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "submit-event-form" }));

    await waitFor(() => {
      expect(apiMock.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Event: Krakow - Rynek",
          location: expect.objectContaining({
            lat: 50.06143,
            lon: 19.93658,
            display_name: "Krakow - Rynek",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText("1 event(s) on map")).toBeInTheDocument();
    });

    expect(fullMapLastProps.events).toHaveLength(1);
  });

  it("resets map by remounting FullMap instance", async () => {
    render(<MapPage />);

    await waitFor(() => {
      expect(fullMapMountCount).toBe(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset mapy" }));

    await waitFor(() => {
      expect(fullMapMountCount).toBe(2);
      expect(fullMapUnmountCount).toBe(1);
    });
  });
});
