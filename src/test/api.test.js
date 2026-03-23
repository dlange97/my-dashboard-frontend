import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

function mockFetch(status, body) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

describe("api request helper", () => {
  beforeEach(() => {
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

  it("createRoute sends POST to /events/routes", async () => {
    const payload = { name: "Test", geoJson: {}, distanceMeters: 100 };
    const opts = await spyRequest("createRoute", "/events/routes", [payload]);
    expect(opts.method).toBe("POST");
    expect(opts.url).toContain("/events/routes");
    expect(JSON.parse(opts.body)).toMatchObject({ name: "Test" });
  });

  it("updateListStatus sends PATCH to /dashboard/shopping-lists/{id}/status", async () => {
    const opts = await spyRequest(
      "updateListStatus",
      "/dashboard/shopping-lists/5/status",
      [5, "archived"],
    );
    expect(opts.method).toBe("PATCH");
    expect(opts.url).toContain("/dashboard/shopping-lists/5/status");
    expect(JSON.parse(opts.body)).toEqual({ status: "archived" });
  });

  it("deleteRoute sends DELETE to /events/routes/{id}", async () => {
    const opts = await spyRequest("deleteRoute", "/events/routes/3", [3]);
    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/events/routes/3");
  });

  it("updateUser sends PATCH to /auth/users/{id}", async () => {
    const opts = await spyRequest("updateUser", "/auth/users/u-1", [
      "u-1",
      { firstName: "A", lastName: "B", email: "a@b.pl", role: "ROLE_USER" },
    ]);

    expect(opts.method).toBe("PATCH");
    expect(opts.url).toContain("/auth/users/u-1");
    expect(JSON.parse(opts.body)).toMatchObject({
      firstName: "A",
      lastName: "B",
      email: "a@b.pl",
      role: "ROLE_USER",
    });
  });

  it("deleteUser sends DELETE to /auth/users/{id}", async () => {
    const opts = await spyRequest("deleteUser", "/auth/users/u-2", ["u-2"]);

    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/auth/users/u-2");
  });

  it("clearInboxNotifications sends DELETE to /notification/inbox", async () => {
    const opts = await spyRequest(
      "clearInboxNotifications",
      "/notification/inbox",
      [],
    );

    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/notification/inbox");
  });

  it("shareTodo sends POST to /dashboard/todos/{id}/share with userId", async () => {
    const opts = await spyRequest("shareTodo", "/dashboard/todos/5/share", [
      5,
      "user-abc",
    ]);
    expect(opts.method).toBe("POST");
    expect(opts.url).toContain("/dashboard/todos/5/share");
    expect(JSON.parse(opts.body)).toEqual({ userId: "user-abc" });
  });

  it("unshareTodo sends DELETE to /dashboard/todos/{id}/share/{userId}", async () => {
    const opts = await spyRequest(
      "unshareTodo",
      "/dashboard/todos/5/share/user-abc",
      [5, "user-abc"],
    );
    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/dashboard/todos/5/share/user-abc");
  });

  it("shareList sends POST to /dashboard/shopping-lists/{id}/share with userId", async () => {
    const opts = await spyRequest(
      "shareList",
      "/dashboard/shopping-lists/7/share",
      [7, "user-xyz"],
    );
    expect(opts.method).toBe("POST");
    expect(opts.url).toContain("/dashboard/shopping-lists/7/share");
    expect(JSON.parse(opts.body)).toEqual({ userId: "user-xyz" });
  });

  it("unshareList sends DELETE to /dashboard/shopping-lists/{id}/share/{userId}", async () => {
    const opts = await spyRequest(
      "unshareList",
      "/dashboard/shopping-lists/7/share/user-xyz",
      [7, "user-xyz"],
    );
    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/dashboard/shopping-lists/7/share/user-xyz");
  });

  it("shareEvent sends POST to /events/{id}/share with userId", async () => {
    const opts = await spyRequest("shareEvent", "/events/3/share", [
      3,
      "user-ev",
    ]);
    expect(opts.method).toBe("POST");
    expect(opts.url).toContain("/events/3/share");
    expect(JSON.parse(opts.body)).toEqual({ userId: "user-ev" });
  });

  it("unshareEvent sends DELETE to /events/{id}/share/{userId}", async () => {
    const opts = await spyRequest("unshareEvent", "/events/3/share/user-ev", [
      3,
      "user-ev",
    ]);
    expect(opts.method).toBe("DELETE");
    expect(opts.url).toContain("/events/3/share/user-ev");
  });

  it("getShareableUsers sends GET to /auth/users/options", async () => {
    const opts = await spyRequest(
      "getShareableUsers",
      "/auth/users/options",
      [],
    );
    expect(opts.method).toBe("GET");
    expect(opts.url).toContain("/auth/users/options");
  });
});
