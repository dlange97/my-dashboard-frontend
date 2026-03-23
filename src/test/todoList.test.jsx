import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import TodoList from "../components/todolist/TodoList";

const MY_USER_ID = "user-me";
const OTHER_USER_ID = "user-other";

const TODOS = [
  {
    id: 1,
    text: "Buy milk",
    done: false,
    ownerId: MY_USER_ID,
    sharedWithUserIds: [],
    createdAt: "2030-01-01T10:00:00",
  },
  {
    id: 2,
    text: "Call doctor",
    done: false,
    ownerId: OTHER_USER_ID,
    sharedWithUserIds: [MY_USER_ID],
    createdAt: "2030-01-02T10:00:00",
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
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    toggleTodo: vi.fn(),
    deleteTodo: vi.fn(),
    shareTodo: vi.fn(),
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

// ShareUserModal is used by TodoList – keep it real so we can interact with it
// but fake LocationPicker / css imports that would break in jsdom
vi.mock("../components/ui/share-user-modal.css", () => ({}));

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.getTodos.mockResolvedValue([...TODOS]);
  apiMock.getShareableUsers.mockResolvedValue(USERS);
  apiMock.shareTodo.mockResolvedValue({
    ...TODOS[0],
    sharedWithUserIds: ["user-alice"],
  });
});

describe("TodoList", () => {
  it("renders todo items fetched from the API", async () => {
    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Call doctor")).toBeInTheDocument();
    });
  });

  it("shows share button only for todos owned by the current user", async () => {
    render(<TodoList />);

    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });

    const shareButtons = screen.queryAllByRole("button", {
      name: /share task/i,
    });
    expect(shareButtons).toHaveLength(1);
  });

  it("opens the share modal when the share button is clicked", async () => {
    render(<TodoList />);

    await waitFor(() =>
      expect(screen.getByText("Buy milk")).toBeInTheDocument(),
    );

    const shareBtn = screen.getByRole("button", { name: /share task/i });
    await act(async () => {
      fireEvent.click(shareBtn);
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Udostępnij zadanie")).toBeInTheDocument();
    });
  });

  it("loads shareable users when the share modal opens", async () => {
    render(<TodoList />);

    await waitFor(() =>
      expect(screen.getByText("Buy milk")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share task/i }));
    });

    await waitFor(() => {
      expect(apiMock.getShareableUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, perPage: 50 }),
      );
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
  });

  it("calls api.shareTodo and closes the modal on confirm", async () => {
    render(<TodoList />);

    await waitFor(() =>
      expect(screen.getByText("Buy milk")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share task/i }));
    });

    await waitFor(() =>
      expect(screen.getByText("Alice Smith")).toBeInTheDocument(),
    );

    // select Alice
    const aliceRadio = screen.getAllByRole("radio")[0];
    await act(async () => {
      fireEvent.click(aliceRadio);
    });

    // confirm share
    const confirmBtn = screen.getByRole("button", { name: /^udostępnij$/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(apiMock.shareTodo).toHaveBeenCalledWith(1, "user-alice");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the modal without calling shareTodo when cancel is clicked", async () => {
    render(<TodoList />);

    await waitFor(() =>
      expect(screen.getByText("Buy milk")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /share task/i }));
    });

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    const cancelBtn = screen.getByRole("button", { name: /anuluj/i });
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apiMock.shareTodo).not.toHaveBeenCalled();
  });

  it("does not show add-form by default; shows it after clicking + button", async () => {
    render(<TodoList />);

    await waitFor(() =>
      expect(screen.getByText("Buy milk")).toBeInTheDocument(),
    );

    expect(screen.queryByPlaceholderText(/task/i)).not.toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /add task/i });
    fireEvent.click(addBtn);

    expect(
      screen.getByRole("button", { name: /add task/i }),
    ).toBeInTheDocument();
  });
});
