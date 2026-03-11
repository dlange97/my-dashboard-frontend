const API_BASE = "/api";
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
  getLists: () => request("GET", "/shopping-lists"),
  createList: (payload) => request("POST", "/shopping-lists", payload),
  updateList: (id, payload) => request("PUT", `/shopping-lists/${id}`, payload),
  updateListStatus: (id, status) =>
    request("PATCH", `/shopping-lists/${id}/status`, { status }),
  deleteList: (id) => request("DELETE", `/shopping-lists/${id}`),
  addProduct: (listId, product) =>
    request("POST", `/shopping-lists/${listId}/products`, product),
  removeProduct: (listId, productId) =>
    request("DELETE", `/shopping-lists/${listId}/products/${productId}`),

  getTodos: () => request("GET", "/todos"),
  createTodo: (payload) => request("POST", "/todos", payload),
  toggleTodo: (id) => request("PATCH", `/todos/${id}/toggle`),
  updateTodo: (id, payload) => request("PATCH", `/todos/${id}`, payload),
  deleteTodo: (id) => request("DELETE", `/todos/${id}`),

  getEvents: () => request("GET", "/events"),
  createEvent: (payload) => request("POST", "/events", payload),
  updateEvent: (id, payload) => request("PUT", `/events/${id}`, payload),
  deleteEvent: (id) => request("DELETE", `/events/${id}`),

  getRoutes: () => request("GET", "/routes"),
  getRoutesByEvent: (eventId) => request("GET", `/routes/event/${eventId}`),
  createRoute: (payload) => request("POST", "/routes", payload),
  updateRoute: (id, payload) => request("PUT", `/routes/${id}`, payload),
  deleteRoute: (id) => request("DELETE", `/routes/${id}`),

  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),
  register: (email, password, firstName, lastName) =>
    request("POST", "/auth/register", { email, password, firstName, lastName }),
  requestAccess: (payload) => request("POST", "/auth/request-access", payload),
  me: () => request("GET", "/auth/me"),

  getUsers: () => request("GET", "/auth/users"),
  createUser: (payload) => request("POST", "/auth/users", payload),
  assignUserRole: (userId, role) =>
    request("PATCH", `/auth/users/${userId}/role`, { role }),

  getAccessSettings: () => request("GET", "/auth/settings/access"),

  getRoles: () => request("GET", "/auth/roles"),
  createRole: (payload) => request("POST", "/auth/roles", payload),
  updateRole: (id, payload) => request("PUT", `/auth/roles/${id}`, payload),
  deleteRole: (id) => request("DELETE", `/auth/roles/${id}`),

  getInboxNotifications: () => request("GET", "/notifications/inbox"),
  markInboxRead: (notificationId) =>
    request("PATCH", `/notifications/inbox/${notificationId}/read`),
  getNotificationTemplate: () =>
    request("GET", "/notifications/settings/template/request-access"),
  updateNotificationTemplate: (payload) =>
    request("PUT", "/notifications/settings/template/request-access", payload),
};

export default api;
