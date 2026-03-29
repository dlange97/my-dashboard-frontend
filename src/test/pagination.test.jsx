import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Pagination from "../components/ui/Pagination";

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback ?? _key,
  }),
}));

function mockMatchMedia(matches) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: "(max-width: 700px)",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("Pagination", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("renders desktop pagination with jump input and allows direct page change", () => {
    window.matchMedia = mockMatchMedia(false);
    const onPageChange = vi.fn();

    render(<Pagination page={3} totalPages={12} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenCalledWith(4);

    const jumpInput = screen.getByLabelText(/jump to page/i);
    fireEvent.change(jumpInput, { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: /^go$/i }));

    expect(onPageChange).toHaveBeenCalledWith(9);
  });

  it("renders mobile controls and changes page using previous/next actions", () => {
    window.matchMedia = mockMatchMedia(true);
    const onPageChange = vi.fn();

    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText("Page 2 / 5")).toBeInTheDocument();

    const prevButtons = screen.getAllByRole("button", { name: /^previous$/i });
    const nextButtons = screen.getAllByRole("button", { name: /^next$/i });

    fireEvent.click(prevButtons[0]);
    fireEvent.click(nextButtons[0]);

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
