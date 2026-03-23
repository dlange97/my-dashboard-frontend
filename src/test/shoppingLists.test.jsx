import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ShoppingPage from "../pages/ShoppingPage";

const MY_USER_ID = "user-me";
const OTHER_USER_ID = "user-other";

const LISTS = [
  {
    id: 10,
    name: "Weekly groceries",
    status: "active",
    ownerId: MY_USER_ID,
    sharedWithUserIds: [],
    products: [{ name: "Bread", qty: 1, bought: false }],
    dueDate: null,
  },
  {
    id: 11,
    name: "Party supplies",
    status: "active",
    ownerId: OTHER_USER_ID,
    sharedWithUserIds: [MY_USER_ID],
    products: [],
    dueDate: null,
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
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    updateListStatus: vi.fn(),
    deleteList: vi.fn(),
    shareList: vi.fn(),
    getShareableUsers: vi.fn(),
  },
  authMock: {
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

vi.mock("../components/ui/share-user-modal.css", () => ({}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ShoppingPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.getLists.mockResolvedValue([...LISTS]);
  apiMock.getShareableUsers.mockResolvedValue(USERS);
  apiMock.shareList.mockResolvedValue({
    ...LISTS[0],
    sharedWithUserIds: ["user-alice"],
  });
});

describe("ShoppingLists", () => {
  it("renders shopping lists fetched from the API", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument();
      expect(screen.getByText("Party supplies")).toBeInTheDocument();
    });
  });

  it("shows share (👥) button only on lists owned by the current user", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    const shareButtons = screen.queryAllByRole("button", {
      name: /udostępnij listę/i,
    });
    expect(shareButtons).toHaveLength(1);
  });

  it("opens the share modal when the 👥 button is clicked in grid view", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    const shareBtn = screen.getByRole("button", { name: /udostępnij listę/i });
    await act(async () => {
      fireEvent.click(shareBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Udostępnij listę zakupów")).toBeInTheDocument();
    });
  });

  it("loads shareable users when the share modal opens", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /udostępnij listę/i }),
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

  it("calls api.shareList and closes the modal on confirm", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /udostępnij listę/i }),
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
      expect(apiMock.shareList).toHaveBeenCalledWith(10, "user-alice");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the modal without calling shareList when cancel is clicked", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /udostępnij listę/i }),
      );
    });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /anuluj/i }));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiMock.shareList).not.toHaveBeenCalled();
  });

  it("shows Udostępnij button in detail view for owned lists", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    // open the list via grid click
    await act(async () => {
      fireEvent.click(screen.getByText("Weekly groceries"));
    });

    await waitFor(() => {
      // The detail view has a "Udostępnij" text button (not icon)
      expect(
        screen.getByRole("button", { name: /^udostępnij$/i }),
      ).toBeInTheDocument();
    });
  });

  it("status filter buttons change the visible list counts", async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("Weekly groceries")).toBeInTheDocument(),
    );

    const archivedFilter = screen.getByRole("button", { name: /archived/i });
    await act(async () => {
      fireEvent.click(archivedFilter);
    });

    // Both lists are active, so archived view should show none
    expect(screen.queryByText("Weekly groceries")).not.toBeInTheDocument();
    expect(screen.queryByText("Party supplies")).not.toBeInTheDocument();
  });
});
