import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import SetPasswordPage from "../pages/SetPasswordPage";

const validateInviteMock = vi.fn();
const acceptInviteMock = vi.fn();

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback,
    locale: "en",
    changeLocale: vi.fn(),
  }),
}));

vi.mock("../api/api", () => ({
  default: {
    validateInvite: (...args) => validateInviteMock(...args),
    acceptInvite: (...args) => acceptInviteMock(...args),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/set-password/tok-1"]}>
      <Routes>
        <Route path="/set-password/:token" element={<SetPasswordPage />} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SetPasswordPage", () => {
  beforeEach(() => {
    validateInviteMock.mockReset();
    acceptInviteMock.mockReset();
  });

  it("shows an error when the invite token is invalid", async () => {
    validateInviteMock.mockResolvedValue({ valid: false });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Invalid invitation")).toBeInTheDocument();
    });
    expect(acceptInviteMock).not.toHaveBeenCalled();
  });

  it("submits the new password for a valid invite", async () => {
    validateInviteMock.mockResolvedValue({
      valid: true,
      email: "invitee@example.com",
    });
    acceptInviteMock.mockResolvedValue({ message: "ok" });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Set your password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "SecurePass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "SecurePass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set password" }));

    await waitFor(() => {
      expect(acceptInviteMock).toHaveBeenCalledWith("tok-1", "SecurePass123");
    });
    expect(screen.getByText("Password set")).toBeInTheDocument();
  });

  it("blocks submission when passwords do not match", async () => {
    validateInviteMock.mockResolvedValue({ valid: true, email: "x@y.pl" });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Set your password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "SecurePass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Different123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Set password" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });
    expect(acceptInviteMock).not.toHaveBeenCalled();
  });
});
