import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotesPage from "../pages/NotesPage";

const getNotesMock = vi.fn();
const createNoteMock = vi.fn();
const updateNoteMock = vi.fn();
const deleteNoteMock = vi.fn();

const editorState = {
  html: "<p>Updated body</p>",
  currentColor: "#112233",
  setContent: vi.fn((content) => {
    editorState.html = content;
  }),
  run: vi.fn(),
};

const editor = {
  getHTML: vi.fn(() => editorState.html),
  getAttributes: vi.fn(() => ({ color: editorState.currentColor })),
  isActive: vi.fn(() => false),
  commands: {
    setContent: (...args) => editorState.setContent(...args),
  },
  chain: vi.fn(() => ({
    focus: () => ({
      toggleBold: () => ({ run: editorState.run }),
      toggleItalic: () => ({ run: editorState.run }),
      toggleStrike: () => ({ run: editorState.run }),
      toggleHeading: () => ({ run: editorState.run }),
      toggleBlockquote: () => ({ run: editorState.run }),
      toggleCode: () => ({ run: editorState.run }),
      toggleCodeBlock: () => ({ run: editorState.run }),
      toggleBulletList: () => ({ run: editorState.run }),
      toggleOrderedList: () => ({ run: editorState.run }),
      setLink: () => ({ run: editorState.run }),
      insertContent: () => ({ run: editorState.run }),
      setHorizontalRule: () => ({ run: editorState.run }),
      setColor: (color) => ({
        run: () => {
          editorState.currentColor = color;
        },
      }),
      unsetColor: () => ({ run: editorState.run }),
    }),
  })),
  state: {
    selection: {
      empty: true,
    },
  },
};

vi.mock("@tiptap/react", () => ({
  useEditor: () => editor,
  EditorContent: ({ className }) => (
    <div className={className} data-testid="notes-editor" />
  ),
}));

vi.mock("@tiptap/starter-kit", () => ({ default: {} }));
vi.mock("@tiptap/extension-color", () => ({ Color: {} }));
vi.mock("@tiptap/extension-text-style", () => ({ TextStyle: {} }));
vi.mock("@tiptap/extension-link", () => ({
  default: { configure: () => ({}) },
}));

vi.mock("../components/nav/NavBar", () => ({
  default: () => <div data-testid="nav-bar" />,
}));

vi.mock("../components/notifications/InboxSidebar", () => ({
  default: () => <div data-testid="inbox-sidebar" />,
}));

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
  }),
}));

vi.mock("../api/api", () => ({
  default: {
    getNotes: (...args) => getNotesMock(...args),
    createNote: (...args) => createNoteMock(...args),
    updateNote: (...args) => updateNoteMock(...args),
    deleteNote: (...args) => deleteNoteMock(...args),
  },
}));

describe("NotesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    editorState.html = "<p>Initial note</p>";
    editorState.currentColor = "#112233";
    getNotesMock.mockResolvedValue([
      { id: 10, title: "First note", content: "<p>Initial note</p>" },
    ]);
    updateNoteMock.mockResolvedValue({
      id: 10,
      title: "Renamed note",
      content: "<p>Updated body</p>",
    });
  });

  it("loads notes and shows the editor toolbar", async () => {
    render(<NotesPage />);

    await waitFor(() => {
      expect(getNotesMock).toHaveBeenCalledTimes(1);
      expect(screen.getByDisplayValue("First note")).toBeInTheDocument();
    });

    expect(screen.getByTestId("notes-editor")).toBeInTheDocument();
    expect(screen.getByTitle("Bold")).toBeInTheDocument();
    expect(screen.getByTitle("Kolor tekstu")).toBeInTheDocument();
    expect(editorState.setContent).toHaveBeenCalledWith("<p>Initial note</p>");
  });

  it("saves edited title and current editor HTML on mouse leave", async () => {
    render(<NotesPage />);

    const titleInput = await screen.findByDisplayValue("First note");
    fireEvent.change(titleInput, { target: { value: "Renamed note" } });

    editorState.html = "<p>Updated body</p>";
    fireEvent.mouseLeave(titleInput.closest(".notes-editor-wrap"));

    await waitFor(() => {
      expect(updateNoteMock).toHaveBeenCalledWith(10, {
        title: "Renamed note",
        content: "<p>Updated body</p>",
      });
    });
  });
});
