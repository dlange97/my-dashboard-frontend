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
});
