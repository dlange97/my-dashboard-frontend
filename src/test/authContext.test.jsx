import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

function Probe() {
  const { isAuthenticated } = useAuth();
  return <div data-testid="auth-state">{isAuthenticated ? "yes" : "no"}</div>;
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not crash when dashboard_user contains invalid JSON", () => {
    localStorage.setItem("dashboard_token", "broken-token");
    localStorage.setItem("dashboard_user", "{invalid-json");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("auth-state")).toHaveTextContent("no");
    expect(localStorage.getItem("dashboard_user")).toBeNull();
    expect(localStorage.getItem("dashboard_token")).toBeNull();
  });
});
