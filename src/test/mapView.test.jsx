import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { FullMap } from "../components/events/MapView";

let mapClickHandler = null;

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    getRoutes: vi.fn(),
    getMapPoints: vi.fn(),
    createMapPoint: vi.fn(),
    updateMapPoint: vi.fn(),
    deleteMapPoint: vi.fn(),
    createRoute: vi.fn(),
    updateRoute: vi.fn(),
    deleteRoute: vi.fn(),
  },
}));

// Helpers to build events with deterministic status
const futureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};
const pastDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
};
const nowDate = () => new Date().toISOString();

function makeEvent(id, overrides = {}) {
  return {
    id,
    title: `Event ${id}`,
    startAt: futureDate(),
    endAt: null,
    location: {
      display_name: `Miejsce ${id}`,
      lat: 52 + id * 0.1,
      lon: 21 + id * 0.1,
    },
    ownerId: "u1",
    ...overrides,
  };
}

vi.mock("react-leaflet", () => {
  const SimpleWrap = ({ children }) => <div>{children}</div>;
  const LayersControl = ({ children }) => <div>{children}</div>;
  LayersControl.BaseLayer = ({ children }) => <div>{children}</div>;

  return {
    MapContainer: SimpleWrap,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: SimpleWrap,
    Popup: SimpleWrap,
    LayersControl,
    GeoJSON: () => <div data-testid="geojson" />,
    useMap: () => ({ flyTo: vi.fn() }),
    useMapEvents: (handlers) => {
      mapClickHandler = handlers.click;
      return {};
    },
  };
});

vi.mock("../components/events/RouteDrawing", () => ({
  default: () => <div data-testid="route-drawing" />,
}));

vi.mock("../components/ui", () => ({
  ConfirmModal: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-modal">
      <span>{title}</span>
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../api/api", () => ({
  default: apiMock,
}));

describe("FullMap", () => {
  beforeEach(() => {
    mapClickHandler = null;
    apiMock.getRoutes.mockReset();
    apiMock.getMapPoints.mockReset();
    apiMock.createMapPoint.mockReset();
    apiMock.updateMapPoint.mockReset();
    apiMock.deleteMapPoint.mockReset();
    apiMock.createRoute.mockReset();
    apiMock.updateRoute.mockReset();
    apiMock.deleteRoute.mockReset();

    apiMock.getRoutes.mockResolvedValue([]);
    apiMock.getMapPoints.mockResolvedValue([]);
  });

  it("triggers create and edit event actions from map controls", async () => {
    const onCreateEventAtLocation = vi.fn();
    const onEditEvent = vi.fn();

    render(
      <FullMap
        events={[
          {
            id: 11,
            title: "Konferencja",
            startAt: "2030-01-10T12:00:00+00:00",
            location: { display_name: "Warszawa", lat: 52.23, lon: 21.01 },
          },
        ]}
        canManageRoutes={false}
        canManageEvents={true}
        onCreateEventAtLocation={onCreateEventAtLocation}
        onEditEvent={onEditEvent}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiMock.getMapPoints).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /event/i }));
    expect(mapClickHandler).toBeTypeOf("function");

    await act(async () => {
      mapClickHandler({ latlng: { lat: 52.2297, lng: 21.0122 } });
    });

    expect(onCreateEventAtLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 52.2297,
        lon: 21.0122,
      }),
    );
    expect(onCreateEventAtLocation).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Edytuj" }));
    expect(onEditEvent).toHaveBeenCalledTimes(1);
  });

  it("creates and deletes map point via API", async () => {
    const onDeleteEvent = vi.fn().mockResolvedValue(undefined);

    apiMock.createMapPoint.mockResolvedValue({
      id: 101,
      name: "Nowy punkt",
      description: "Opis",
      lat: 50.0,
      lon: 19.0,
    });

    apiMock.getMapPoints.mockResolvedValueOnce([
      {
        id: 90,
        name: "Stary punkt",
        description: null,
        lat: 50.1,
        lon: 19.2,
      },
    ]);

    render(
      <FullMap
        events={[]}
        canManageRoutes={false}
        canManageEvents={true}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={onDeleteEvent}
      />,
    );

    await waitFor(() => {
      expect(apiMock.getMapPoints).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /dodaj punkt/i }));

    expect(mapClickHandler).toBeTypeOf("function");
    await act(async () => {
      mapClickHandler({ latlng: { lat: 50.0, lng: 19.0 } });
    });

    fireEvent.change(screen.getByPlaceholderText("Np. Punkt zbiórki"), {
      target: { value: "Nowy punkt" },
    });
    fireEvent.change(screen.getByPlaceholderText("Dodatkowe informacje"), {
      target: { value: "Opis" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(apiMock.createMapPoint).toHaveBeenCalledWith({
        name: "Nowy punkt",
        description: "Opis",
        lat: 50,
        lon: 19,
      });
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Usuń punkt" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(apiMock.deleteMapPoint).toHaveBeenCalledWith(101);
    });
  });

  it("triggers create event from custom point popup action", async () => {
    const onCreateEventAtLocation = vi.fn();

    apiMock.getMapPoints.mockResolvedValueOnce([
      {
        id: 77,
        name: "Punkt testowy",
        description: "Opis",
        lat: 51.1079,
        lon: 17.0385,
      },
    ]);

    render(
      <FullMap
        events={[]}
        canManageRoutes={false}
        canManageEvents={true}
        onCreateEventAtLocation={onCreateEventAtLocation}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiMock.getMapPoints).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Utwórz event tutaj" }));

    expect(onCreateEventAtLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        lat: 51.1079,
        lon: 17.0385,
        display_name: "Punkt testowy",
        suggestedTitle: "Event: Punkt testowy",
      }),
    );
  });

  it("shows correct event counts per status in filter panel", async () => {
    const events = [
      makeEvent(1, { startAt: futureDate() }), // upcoming
      makeEvent(2, { startAt: futureDate() }), // upcoming
      makeEvent(3, { startAt: pastDate(), endAt: pastDate() }), // past
      makeEvent(4, { startAt: nowDate(), endAt: futureDate() }), // today
    ];

    render(
      <FullMap
        events={events}
        canManageRoutes={false}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    expect(screen.getByText(/Zbliżające się \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Trwające \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Minione \(1\)/)).toBeInTheDocument();
  });

  it("filters events by search text", async () => {
    const events = [
      makeEvent(10, {
        title: "Festiwal Jazzowy",
        location: { display_name: "Kraków", lat: 50.06, lon: 19.94 },
      }),
      makeEvent(11, {
        title: "Konferencja IT",
        location: { display_name: "Warszawa", lat: 52.23, lon: 21.01 },
      }),
    ];

    render(
      <FullMap
        events={events}
        canManageRoutes={false}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    // Both visible initially — text is split by <strong> tags so use textContent
    const infoEl = () => screen.getByText(/Wyniki:/);
    expect(infoEl().textContent.replace(/\s+/g, " ")).toContain(
      "Wyniki: 2 z 2",
    );

    fireEvent.change(screen.getByPlaceholderText(/Szukaj po nazwie/), {
      target: { value: "jazz" },
    });

    expect(infoEl().textContent.replace(/\s+/g, " ")).toContain(
      "Wyniki: 1 z 2",
    );
  });

  it("filters events by date range", async () => {
    const jan2030 = "2030-01-15T10:00:00.000Z";
    const jun2030 = "2030-06-15T10:00:00.000Z";

    const events = [
      makeEvent(20, {
        startAt: jan2030,
        location: { display_name: "Warszawa", lat: 52.23, lon: 21.01 },
      }),
      makeEvent(21, {
        startAt: jun2030,
        location: { display_name: "Gdańsk", lat: 54.35, lon: 18.65 },
      }),
    ];

    render(
      <FullMap
        events={events}
        canManageRoutes={false}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    const infoEl = () => screen.getByText(/Wyniki:/);
    expect(infoEl().textContent.replace(/\s+/g, " ")).toContain(
      "Wyniki: 2 z 2",
    );

    // Restrict to Jan–Mar 2030: only jan event passes
    fireEvent.change(screen.getByLabelText(/Od:/), {
      target: { value: "2030-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Do:/), {
      target: { value: "2030-03-31" },
    });

    expect(infoEl().textContent.replace(/\s+/g, " ")).toContain(
      "Wyniki: 1 z 2",
    );
  });

  it("clears all filters via Wyczyść button", async () => {
    const events = [
      makeEvent(30, { startAt: pastDate(), endAt: pastDate() }), // past
    ];

    render(
      <FullMap
        events={events}
        canManageRoutes={false}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    const infoEl = () => screen.getByText(/Wyniki:/);

    // "past" filter is off by default → event not shown
    expect(infoEl().textContent.replace(/\s+/g, " ")).toContain(
      "Wyniki: 0 z 1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Wyczyść" }));

    // After clear, past is still off (default state) — count unchanged
    expect(infoEl().textContent.replace(/\s+/g, " ")).toContain(
      "Wyniki: 0 z 1",
    );
  });

  it("does not render edit/delete popup buttons when canManageEvents is false", async () => {
    const events = [makeEvent(40, { startAt: futureDate() })];

    render(
      <FullMap
        events={events}
        canManageRoutes={false}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: "Edytuj" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Usuń" })).toBeNull();
  });

  it("renders route drawing panel when canManageRoutes and toggled", async () => {
    render(
      <FullMap
        events={[]}
        canManageRoutes={true}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    expect(screen.queryByTestId("route-drawing")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Trasa/i }));

    expect(screen.getByTestId("route-drawing")).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByRole("button", { name: /Zamknij/i }));
    expect(screen.queryByTestId("route-drawing")).toBeNull();
  });

  it("updates point name via edit form", async () => {
    apiMock.getMapPoints.mockResolvedValueOnce([
      { id: 55, name: "Stary punkt", description: "", lat: 50.0, lon: 19.0 },
    ]);
    apiMock.updateMapPoint.mockResolvedValue({
      id: 55,
      name: "Nowa nazwa",
      description: "",
      lat: 50.0,
      lon: 19.0,
    });

    render(
      <FullMap
        events={[]}
        canManageRoutes={false}
        canManageEvents={false}
        onCreateEventAtLocation={vi.fn()}
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />,
    );

    await waitFor(() => expect(apiMock.getMapPoints).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Edytuj punkt" }));

    const nameInput = screen.getByDisplayValue("Stary punkt");
    fireEvent.change(nameInput, { target: { value: "Nowa nazwa" } });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(apiMock.updateMapPoint).toHaveBeenCalledWith(
        55,
        expect.objectContaining({
          name: "Nowa nazwa",
        }),
      );
    });
  });
});
