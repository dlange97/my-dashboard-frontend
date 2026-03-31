import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import "./styles/base.css";
import "./styles/layout.css";
import "./styles/buttons.css";
import "./styles/modal.css";
import "./styles/dashboard.css";
import "./components/shoppinglist/shoppinglist.css";
import "./components/shoppinglist/product-form.css";
import "./components/todolist/todo.css";
import "./components/events/events.css";
import "./components/notifications/notifications.css";

import Login from "./components/auth/Login";
import NotFoundPage from "./pages/NotFoundPage";
import CheckoutPage from "./pages/CheckoutPage";
import InstancePickerPage from "./pages/InstancePickerPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TodoPage = lazy(() => import("./pages/TodoPage"));
const ShoppingPage = lazy(() => import("./pages/ShoppingPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function ProtectedRoute({ children }) {
  const { isAuthenticated, needsInstanceSelection } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (needsInstanceSelection) return <Navigate to="/select-instance" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

/** Requires authentication only — no instance selection check (used by /select-instance). */
function AuthOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PermissionRoute({ permission, children }) {
  const { hasPermission } = useAuth();
  return hasPermission(permission) ? (
    children
  ) : (
    <NotFoundPage type="forbidden" />
  );
}

function App() {
  return (
    <Suspense fallback={<div className="app-page-loading">Loading…</div>}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="dashboard.view">
                <DashboardPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/todos"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="todos.view">
                <TodoPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shopping"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="shopping.view">
                <ShoppingPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="events.view">
                <EventsPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="events.view">
                <CalendarPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="map.view">
                <MapPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="users.view">
                <UsersPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PermissionRoute permission="settings.view">
                <SettingsPage />
              </PermissionRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/checkout/:hash" element={<CheckoutPage />} />
        <Route
          path="/select-instance"
          element={
            <AuthOnlyRoute>
              <InstancePickerPage />
            </AuthOnlyRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
