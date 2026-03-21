import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../components/auth/Login";

const loginMock = vi.fn();
const requestAccessMock = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
  }),
}));

vi.mock("../context/TranslationContext", () => ({
  useTranslation: () => ({
    t: (_key, fallback) => fallback,
    locale: "en",
    changeLocale: vi.fn(),
  }),
}));

vi.mock("../api/api", () => ({
  default: {
    login: vi.fn(),
    requestAccess: (...args) => requestAccessMock(...args),
  },
}));

describe("Login request access flow", () => {
  beforeEach(() => {
    loginMock.mockReset();
    requestAccessMock.mockReset();
    requestAccessMock.mockResolvedValue({ message: "ok" });
  });

  it("submits request access and returns safely to login view", async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Request Access" }));

    fireEvent.change(screen.getByLabelText("Email *"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("First name (optional)"), {
      target: { value: "Jan" },
    });
    fireEvent.change(screen.getByLabelText("Last name (optional)"), {
      target: { value: "Kowalski" },
    });
    fireEvent.change(screen.getByLabelText("Request access message"), {
      target: { value: "Please grant access" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send Request" }));

    await waitFor(() => {
      expect(requestAccessMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
  });
});
