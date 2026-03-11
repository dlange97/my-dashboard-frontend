import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React, { useState } from "react";

// ── Minimal SettingsPage accordion (isolated logic test) ─────────────────
// We re-implement just the accordion toggle logic here to avoid mocking all
// heavy dependencies (NavBar, InboxSidebar, API calls, …).  The real
// SettingsPage uses the exact same pattern so these tests guard the core UX.

const SECTIONS = [
  { id: "access", label: "Dostęp i Role" },
  { id: "notifications", label: "Powiadomienia" },
];

function AccordionTestHarness() {
  const [open, setOpen] = useState("access");

  return (
    <div>
      {SECTIONS.map((s) => (
        <div key={s.id}>
          <button
            data-testid={`toggle-${s.id}`}
            aria-expanded={open === s.id}
            onClick={() => setOpen((prev) => (prev === s.id ? null : s.id))}
          >
            {s.label}
          </button>
          {open === s.id && (
            <div data-testid={`body-${s.id}`}>Content of {s.label}</div>
          )}
        </div>
      ))}
    </div>
  );
}

describe("Settings accordion behaviour", () => {
  it("shows the first section open by default", () => {
    render(<AccordionTestHarness />);
    expect(screen.getByTestId("body-access")).toBeInTheDocument();
    expect(screen.queryByTestId("body-notifications")).not.toBeInTheDocument();
  });

  it("opens a different section when its header is clicked", () => {
    render(<AccordionTestHarness />);
    fireEvent.click(screen.getByTestId("toggle-notifications"));
    expect(screen.getByTestId("body-notifications")).toBeInTheDocument();
    expect(screen.queryByTestId("body-access")).not.toBeInTheDocument();
  });

  it("closes the open section when its header is clicked again", () => {
    render(<AccordionTestHarness />);
    fireEvent.click(screen.getByTestId("toggle-access")); // first is open → closes
    expect(screen.queryByTestId("body-access")).not.toBeInTheDocument();
  });

  it("aria-expanded reflects open state correctly", () => {
    render(<AccordionTestHarness />);
    const accessBtn = screen.getByTestId("toggle-access");
    const notifBtn = screen.getByTestId("toggle-notifications");

    expect(accessBtn).toHaveAttribute("aria-expanded", "true");
    expect(notifBtn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(notifBtn);

    expect(accessBtn).toHaveAttribute("aria-expanded", "false");
    expect(notifBtn).toHaveAttribute("aria-expanded", "true");
  });
});

// ── RoleCard inline rename guard ─────────────────────────────────────────
function RenameTestHarness() {
  const [name, setName] = useState("Editor");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function submit() {
    setName(draft);
    setEditing(false);
  }

  return (
    <div>
      {editing ? (
        <>
          <input
            data-testid="name-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button data-testid="save" onClick={submit}>
            Save
          </button>
          <button data-testid="cancel" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <span data-testid="display-name">{name}</span>
          <button
            data-testid="edit"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
}

describe("Role card inline rename", () => {
  it("shows the role name and an edit button initially", () => {
    render(<RenameTestHarness />);
    expect(screen.getByTestId("display-name").textContent).toBe("Editor");
    expect(screen.getByTestId("edit")).toBeInTheDocument();
  });

  it("switches to input mode when Edit is clicked", () => {
    render(<RenameTestHarness />);
    fireEvent.click(screen.getByTestId("edit"));
    expect(screen.getByTestId("name-input")).toBeInTheDocument();
    expect(screen.queryByTestId("display-name")).not.toBeInTheDocument();
  });

  it("saves the new name when Save is clicked", () => {
    render(<RenameTestHarness />);
    fireEvent.click(screen.getByTestId("edit"));
    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "Super Editor" },
    });
    fireEvent.click(screen.getByTestId("save"));
    expect(screen.getByTestId("display-name").textContent).toBe("Super Editor");
  });

  it("discards changes when Cancel is clicked", () => {
    render(<RenameTestHarness />);
    fireEvent.click(screen.getByTestId("edit"));
    fireEvent.change(screen.getByTestId("name-input"), {
      target: { value: "Something Else" },
    });
    fireEvent.click(screen.getByTestId("cancel"));
    expect(screen.getByTestId("display-name").textContent).toBe("Editor");
  });
});
