import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import EventsPage from "../pages/EventsPage";

const MY_USER_ID = "user-me";
const OTHER_USER_ID = "user-other";

const EVENTS = [
  {
    id: 1,
    title: "Team meeting",
    description: "",
    startAt: "2030-06-10T10:00:00",
    endAt: null,
    location: null,
    ownerId: MY_USER_ID,
    sharedWithUserIds: [],
  },
  {
    id: 2,
    title: "Doctor appointment",
    description: "",
    startAt: "2030-06-11T14:00:00",
    endAt: null,
    location: null,
    ownerId: OTHER_USER_ID,
    sharedWithUserIds: [MY_USER_ID],
  },
];

const USERS = [
  {
    id: "user-alice",
    firstName: "Alice",
    lastName: "Smith",
    email: "alice@example.com",
  },
  {
    id: "user-bob",
    firstName: "Bob",
    lastName: "Jones",
    email: "bob@example.com",
  },
];

const { apiMock, authMock } = vi.hoisted(() => ({
  apiMock: {
    getEvents: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
    shareEvent: vi.fn(),
    getShareableUsers: vi.fn(),
  },
  authMock: {
    hasPermission: vi.fn(),
    user: { id: "user-me" },
  },
}));

vi.mock("../api/api", () => ({ default: apiMock }));

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

vi.mock("../components/events/EventCalendar", () => ({
  default: () => <div data-testid="calendar" />,
}));

vi.mock("../components/events/LocationPicker", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="location-picker"
      defaultValue={value?.display_name ?? ""}
      onChange={(e) => onChange({ display_name: e.target.value })}
    />
  ),
}));

vi.mock("../components/ui/share-user-modal.css", () => ({}));

beforeEach(() => {
  vi.clearAllMocks();
  authMock.hasPermission.mockReturnValue(true);
  apiMock.getEvents.mockResolvedValue([...EVENTS]);
  apiMock.getShareableUsers.mockResolvedValue(USERS);
  apiMock.shareEvent.mockResolvedValue({
    ...EVENTS[0],
    sharedWithUserIds: ["user-alice"],
  });
  apiMock.updateEvent.mockResolvedValue(EVENTS[0]);
  apiMock.createEvent.mockResolvedValue({ ...EVENTS[0], id: 99 });
  apiMock.deleteEvent.mockResolvedValue(null);
});

describe("EventsPage", () => {
  it("renders events fetched from the API", async () => {
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText("Team meeting")).toBeInTheDocument();
      expect(screen.getByText("Doctor appointment")).toBeInTheDocument();
    });
  });

  it("shows share button only for events owned by the current user", async () => {
    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText("Team meeting")).toBeInTheDocument(),
    );

    const shareButtons = screen.queryAllByRole("button", {
      name: /udostępnij event/i,
    });
    expect(shareButtons).toHaveLength(1);
  });

  it("opens the share modal when the share button is clicked", async () => {
    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText("Team meeting")).toBeInTheDocument(),
    );

    const shareBtn = screen.getByRole("button", { name: /udostępnij event/i });
    await act(async () => {
      fireEvent.click(shareBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Udostępnij event")).toBeInTheDocument();
    });
  });

  it("loads shareable users when the share modal opens", async () => {
    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText("Team meeting")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /udostępnij event/i }),
      );
    });

    await waitFor(() => {
      expect(apiMock.getShareableUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, perPage: 50 }),
      );
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
  });

  it("calls api.shareEvent and closes the modal on confirm", async () => {
    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText("Team meeting")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /udostępnij event/i }),
      );
    });

    await waitFor(() =>
      expect(screen.getByText("Alice Smith")).toBeInTheDocument(),
    );

    const aliceRadio = screen.getAllByRole("radio")[0];
    await act(async () => {
      fireEvent.click(aliceRadio);
    });

    const confirmBtn = screen.getByRole("button", { name: /^udostępnij$/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(apiMock.shareEvent).toHaveBeenCalledWith(1, "user-alice");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the modal without calling shareEvent when cancel is clicked", async () => {
    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText("Team meeting")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /udostępnij event/i }),
      );
    });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /anuluj/i }));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiMock.shareEvent).not.toHaveBeenCalled();
  });

  it("shows Udostępnij button in the edit form for owned events", async () => {
    render(<EventsPage />);

    await waitFor(() =>
      expect(screen.getByText("Team meeting")).toBeInTheDocument(),
    );

    // click Edit on the owned event
    const editButtons = screen.getAllByRole("button", { name: /^edit$/i });
    await act(async () => {
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      // EventForm renders a "Udostępnij" button when initial && canShare
      const formUdostepnij = screen.getByRole("button", {
        name: /^udostępnij$/i,
      });
      expect(formUdostepnij).toBeInTheDocument();
    });
  });
});
