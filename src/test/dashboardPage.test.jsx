import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../pages/DashboardPage";

const meMock = vi.fn();
const updateMyDashboardLayoutMock = vi.fn();

vi.mock("../api/api", () => ({
  default: {
    me: (...args) => meMock(...args),
    updateMyDashboardLayout: (...args) => updateMyDashboardLayoutMock(...args),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      firstName: "Admin",
      email: "admin@example.com",
      dashboardLayout: null,
    },
    hasPermission: () => true,
  }),
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
  default: () => <aside data-testid="inbox-sidebar" />,
}));

vi.mock("../components/dashboard/TodoSummary", () => ({
  default: () => <section className="summary-card">Todo card</section>,
}));

vi.mock("../components/dashboard/ShoppingSummary", () => ({
  default: () => <section className="summary-card">Shopping card</section>,
}));

vi.mock("../components/events/EventsSummary", () => ({
  default: () => <section className="summary-card">Events card</section>,
}));

vi.mock("../components/dashboard/CalendarSummary", () => ({
  default: () => <section className="summary-card">Calendar card</section>,
}));

vi.mock("../components/dashboard/NotesSummary", () => ({
  default: () => <section className="summary-card">Notes card</section>,
}));

describe("DashboardPage tile resizing", () => {
  beforeEach(() => {
    meMock.mockResolvedValue({ user: { dashboardLayout: null } });
    updateMyDashboardLayoutMock.mockResolvedValue({ ok: true });
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      callback();
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps the resize handle inside the tile and resizes only the active tile", async () => {
    render(<DashboardPage />);

    const todoTile = await screen.findByTestId("dashboard-tile-todos");
    const shoppingTile = screen.getByTestId("dashboard-tile-shopping");
    const todoHandle = screen.getByTestId("dashboard-resize-todos");

    await waitFor(() => expect(meMock).toHaveBeenCalled());

    expect(todoTile).toContainElement(todoHandle);
    expect(todoTile.className).toContain("tile-span-4");
    expect(shoppingTile.className).toContain("tile-span-4");

    fireEvent.mouseDown(todoHandle, { clientX: 100, clientY: 100 });

    expect(todoTile.className).toContain("resizing");
    expect(shoppingTile.className).not.toContain("resizing");

    fireEvent.mouseMove(document, { clientX: 260, clientY: 220 });

    await waitFor(() => {
      expect(todoTile.style.getPropertyValue("--tile-scale-x")).not.toBe("1");
      expect(todoTile.style.getPropertyValue("--tile-scale-y")).not.toBe("1");
    });

    expect(shoppingTile.style.getPropertyValue("--tile-scale-x")).toBe("1");
    expect(shoppingTile.style.getPropertyValue("--tile-scale-y")).toBe("1");
    expect(todoTile.className).not.toContain("tile-span-4");
    expect(shoppingTile.className).toContain("tile-span-4");

    fireEvent.mouseUp(document);

    await waitFor(
      () => expect(updateMyDashboardLayoutMock).toHaveBeenCalled(),
      {
        timeout: 1200,
      },
    );
  });

  it("resets resized tiles back to defaults", async () => {
    render(<DashboardPage />);

    const todoTile = await screen.findByTestId("dashboard-tile-todos");
    const todoHandle = screen.getByTestId("dashboard-resize-todos");

    await waitFor(() => expect(meMock).toHaveBeenCalled());

    fireEvent.mouseDown(todoHandle, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 240, clientY: 220 });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(todoTile.style.getPropertyValue("--tile-scale-x")).not.toBe("1");
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Reset tile settings" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(todoTile.style.getPropertyValue("--tile-scale-x")).toBe("1");
      expect(todoTile.style.getPropertyValue("--tile-scale-y")).toBe("1");
      expect(todoTile.className).toContain("tile-span-4");
    });
  });

  it("renders notes tile on dashboard", async () => {
    render(<DashboardPage />);

    const notesTile = await screen.findByTestId("dashboard-tile-notes");

    expect(notesTile).toBeInTheDocument();
    expect(screen.getByText("Notes card")).toBeInTheDocument();
  });
});
