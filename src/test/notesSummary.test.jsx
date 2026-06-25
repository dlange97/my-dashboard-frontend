import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotesSummary from "../components/dashboard/NotesSummary";

const getNotesMock = vi.fn();
const createNoteMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../api/api", () => ({
  default: {
    getNotes: (...args) => getNotesMock(...args),
    createNote: (...args) => createNoteMock(...args),
  },
}));

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { instanceId: "instance-1" },
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("NotesSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getNotesMock.mockResolvedValue([]);
  });

  it("creates a note from the dashboard tile and navigates to it", async () => {
    createNoteMock.mockResolvedValue({
      id: 42,
      title: "Untitled",
      content: "",
    });

    render(
      <MemoryRouter>
        <NotesSummary />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getNotesMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText("Start writing…"), {
      target: { value: "Body from dashboard" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create note" }));

    await waitFor(() => {
      expect(createNoteMock).toHaveBeenCalledWith({
        title: "Untitled",
        content: "Body from dashboard",
        color: "#fef3c7",
      });
      expect(navigateMock).toHaveBeenCalledWith("/notes?noteId=42");
    });
  });
});
