function resolveApiBase() {
  const envBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (envBase) return envBase.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (port === "5173" || port === "3000") {
      return `${protocol}//${hostname}:8081`;
    }
  }

  return "";
}

const API_BASE = resolveApiBase();
const TOKEN_KEY = "dashboard_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const options = { method, headers: authHeaders() };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  getLists: () => request("GET", "/dashboard/shopping-lists"),
  createList: (payload) =>
    request("POST", "/dashboard/shopping-lists", payload),
  updateList: (id, payload) =>
    request("PUT", `/dashboard/shopping-lists/${id}`, payload),
  updateListStatus: (id, status) =>
    request("PATCH", `/dashboard/shopping-lists/${id}/status`, { status }),
  deleteList: (id) => request("DELETE", `/dashboard/shopping-lists/${id}`),
  addProduct: (listId, product) =>
    request("POST", `/dashboard/shopping-lists/${listId}/products`, product),
  removeProduct: (listId, productId) =>
    request(
      "DELETE",
      `/dashboard/shopping-lists/${listId}/products/${productId}`,
    ),

  getTodos: () => request("GET", "/dashboard/todos"),
  createTodo: (payload) => request("POST", "/dashboard/todos", payload),
  toggleTodo: (id) => request("PATCH", `/dashboard/todos/${id}/toggle`),
  updateTodo: (id, payload) =>
    request("PATCH", `/dashboard/todos/${id}`, payload),
  deleteTodo: (id) => request("DELETE", `/dashboard/todos/${id}`),

  getEvents: () => request("GET", "/events"),
  createEvent: (payload) => request("POST", "/events", payload),
  updateEvent: (id, payload) => request("PUT", `/events/${id}`, payload),
  deleteEvent: (id) => request("DELETE", `/events/${id}`),

  getRoutes: () => request("GET", "/events/routes"),
  getRoutesByEvent: (eventId) =>
    request("GET", `/events/routes/event/${eventId}`),
  createRoute: (payload) => request("POST", "/events/routes", payload),
  updateRoute: (id, payload) => request("PUT", `/events/routes/${id}`, payload),
  deleteRoute: (id) => request("DELETE", `/events/routes/${id}`),

  getMapPoints: () => request("GET", "/events/points"),
  createMapPoint: (payload) => request("POST", "/events/points", payload),
  updateMapPoint: (id, payload) =>
    request("PATCH", `/events/points/${id}`, payload),
  deleteMapPoint: (id) => request("DELETE", `/events/points/${id}`),

  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),
  register: (email, password, firstName, lastName) =>
    request("POST", "/auth/register", { email, password, firstName, lastName }),
  requestAccess: (payload) => request("POST", "/auth/request-access", payload),
  me: () => request("GET", "/auth/me"),

  getUsers: ({ page = 1, perPage = 10, search = "" } = {}) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("perPage", String(perPage));
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return request("GET", `/auth/users?${params.toString()}`);
  },
  getUserById: (userId) => request("GET", `/auth/users/${userId}`),
  createUser: (payload) => request("POST", "/auth/users", payload),
  updateUser: (userId, payload) =>
    request("PATCH", `/auth/users/${userId}`, payload),
  deleteUser: (userId) => request("DELETE", `/auth/users/${userId}`),
  assignUserRole: (userId, role) =>
    request("PATCH", `/auth/users/${userId}/role`, { role }),

  getAccessSettings: () => request("GET", "/auth/settings/access"),
  getJwtSessionSettings: () => request("GET", "/auth/settings/jwt-session"),
  getJwtSessionSetting: (id) =>
    request("GET", `/auth/settings/jwt-session/${id}`),
  createJwtSessionSetting: (payload) =>
    request("POST", "/auth/settings/jwt-session", payload),
  updateJwtSessionSetting: (id, payload) =>
    request("PATCH", `/auth/settings/jwt-session/${id}`, payload),
  deleteJwtSessionSetting: (id) =>
    request("DELETE", `/auth/settings/jwt-session/${id}`),

  getRoles: () => request("GET", "/auth/roles"),
  createRole: (payload) => request("POST", "/auth/roles", payload),
  updateRole: (id, payload) => request("PUT", `/auth/roles/${id}`, payload),
  deleteRole: (id) => request("DELETE", `/auth/roles/${id}`),

  getInboxNotifications: () => request("GET", "/notification/inbox"),
  clearInboxNotifications: () => request("DELETE", "/notification/inbox"),
  markInboxRead: (notificationId) =>
    request("PATCH", `/notification/inbox/${notificationId}/read`),
  getNotificationTemplate: () =>
    request("GET", "/notification/settings/template/request-access"),
  updateNotificationTemplate: (payload) =>
    request("PUT", "/notification/settings/template/request-access", payload),
};

export default api;
