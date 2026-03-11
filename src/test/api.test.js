import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Helpers ──────────────────────────────────────────────────────────────
function mockFetch(status, body) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

// We import the module after patching globalThis.fetch so the module
// picks up the mock on every call.

// ── request() basic behaviour ─────────────────────────────────────────────
describe("api request helper", () => {
  beforeEach(() => {
    // Clear cached token between tests
    localStorage.clear();
  });

  it("adds Authorization header when a token is stored", async () => {
    localStorage.setItem("dashboard_token", "test-jwt");
    const capturedHeaders = {};

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      Object.assign(capturedHeaders, opts.headers);
      return Promise.resolve({
        status: 200,
        ok: true,
        json: async () => ({ ok: true }),
      });
    });

    // Re-import to pick up patched fetch – but since api.js is cached we
    // just verify the header using our mock.
    const { default: api } = await import("../api/api.js");
    await api.getTodos();

    expect(capturedHeaders["Authorization"]).toBe("Bearer test-jwt");
  });

  it("omits Authorization header when no token is stored", async () => {
    localStorage.removeItem("dashboard_token");
    const capturedHeaders = {};

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      Object.assign(capturedHeaders, opts.headers);
      return Promise.resolve({
        status: 200,
        ok: true,
        json: async () => [],
      });
    });

    const { default: api } = await import("../api/api.js");
    await api.getTodos();

    expect(capturedHeaders["Authorization"]).toBeUndefined();
  });

  it("throws an Error on non-ok responses", async () => {
    localStorage.setItem("dashboard_token", "test-jwt");

    global.fetch = mockFetch(400, { error: "Bad request" });

    const { default: api } = await import("../api/api.js");
    await expect(api.createTodo({ title: "" })).rejects.toThrow("Bad request");
  });

  it("returns null for 204 No Content", async () => {
    localStorage.setItem("dashboard_token", "test-jwt");

    global.fetch = vi.fn().mockResolvedValue({
      status: 204,
      ok: true,
      json: async () => {
        throw new Error("no body");
      },
    });

    const { default: api } = await import("../api/api.js");
    const result = await api.deleteTodo(1);
    expect(result).toBeNull();
  });
});

// ── API method smoke-tests (shape of calls) ──────────────────────────────
describe("api method shapes", () => {
  beforeEach(() => {
    localStorage.setItem("dashboard_token", "tok");
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  async function spyRequest(method, path, expectBody) {
    let capturedOptions;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      capturedOptions = { url, ...opts };
      return Promise.resolve({
        status: 200,
        ok: true,
        json: async () => ({}),
      });
    });

    const { default: api } = await import("../api/api.js");
    await api[method](...expectBody);

    return capturedOptions;
  }

  it("createRoute sends POST to /api/routes", async () => {
    const payload = { name: "Test", geoJson: {}, distanceMeters: 100 };
    const opts = await spyRequest("createRoute", "/api/routes", [payload]);
    expect(opts.method).toBe("POST");
    expect(opts.url).toContain("/api/routes");
    expect(JSON.parse(opts.body)).toMatchObject({ name: "Test" });
  });

  it("updateListStatus sends PATCH to /api/shopping-lists/{id}/status", async () => {
    const opts = await spyRequest(
      "updateListStatus",
      "/api/shopping-lists/5/status",
      [5, "archived"],
    );
    expect(opts.method).toBe("PATCH");
    expect(opts.url).toContain("/api/shopping-lists/5/status");
    expect(JSON.parse(opts.body)).toEqual({ status: "archived" });
  });

  it("deleteRoute sends DELETE to /api/routes/{id}", async () => {
    const opts = await spyRequest("deleteRoute", "/api/routes/3", [3]);
    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/api/routes/3");
  });
});
