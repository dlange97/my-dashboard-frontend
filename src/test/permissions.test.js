import { describe, it, expect } from "vitest";
import {
  decodeJwtClaims,
  hasPermission,
  hasAnyPermission,
} from "../auth/permissions";

// ── decodeJwtClaims ──────────────────────────────────────────────────────
describe("decodeJwtClaims", () => {
  it("returns null for null/undefined input", () => {
    expect(decodeJwtClaims(null)).toBeNull();
    expect(decodeJwtClaims(undefined)).toBeNull();
    expect(decodeJwtClaims("")).toBeNull();
  });

  it("returns null for a malformed token (no dots)", () => {
    expect(decodeJwtClaims("notavalidtoken")).toBeNull();
  });

  it("decodes a valid JWT payload", () => {
    // Build a real-ish token: header.payload.signature
    const payload = { sub: "user-1", permissions: ["dashboard.view"] };
    const b64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const token = `eyJhbGciOiJSUzI1NiJ9.${b64}.fakesignature`;
    const claims = decodeJwtClaims(token);

    expect(claims).toEqual(payload);
  });

  it("returns null when payload part is invalid base64", () => {
    const token = "header.!!!invalid!!!.signature";
    expect(decodeJwtClaims(token)).toBeNull();
  });
});

// ── hasPermission ────────────────────────────────────────────────────────
describe("hasPermission", () => {
  it("returns true when permission is undefined/null (no restriction)", () => {
    expect(hasPermission(null, undefined)).toBe(true);
    expect(hasPermission(null, null)).toBe(true);
    expect(hasPermission(null, "")).toBe(true);
  });

  it("returns false when user is null", () => {
    expect(hasPermission(null, "dashboard.view")).toBe(false);
  });

  it("returns false when user has no permissions", () => {
    expect(hasPermission({ permissions: [] }, "dashboard.view")).toBe(false);
  });

  it("returns true when user has the permission", () => {
    const user = { permissions: ["dashboard.view", "todos.manage"] };
    expect(hasPermission(user, "dashboard.view")).toBe(true);
    expect(hasPermission(user, "todos.manage")).toBe(true);
  });

  it("returns false when user does not have the permission", () => {
    const user = { permissions: ["dashboard.view"] };
    expect(hasPermission(user, "routes.manage")).toBe(false);
  });
});

// ── hasAnyPermission ─────────────────────────────────────────────────────
describe("hasAnyPermission", () => {
  it("returns false for null user or empty list", () => {
    expect(hasAnyPermission(null, ["dashboard.view"])).toBe(false);
    expect(hasAnyPermission({ permissions: ["dashboard.view"] }, [])).toBe(
      false,
    );
  });

  it("returns true when user has at least one of the listed permissions", () => {
    const user = { permissions: ["shopping.view", "events.view"] };
    expect(hasAnyPermission(user, ["routes.manage", "shopping.view"])).toBe(
      true,
    );
  });

  it("returns false when user has none of the listed permissions", () => {
    const user = { permissions: ["dashboard.view"] };
    expect(hasAnyPermission(user, ["routes.manage", "settings.view"])).toBe(
      false,
    );
  });
});
