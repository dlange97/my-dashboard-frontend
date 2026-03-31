import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  decodeJwtClaims,
  hasAnyPermission,
  hasPermission,
} from "../auth/permissions";
import api from "../api/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "dashboard_token";
const USER_KEY = "dashboard_user";
const LANG_KEY = "dashboard_lang";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) {
      return localStorage.getItem(TOKEN_KEY);
    }

    try {
      JSON.parse(storedUser);
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  });

  const login = useCallback((newToken, newUser) => {
    const claims = decodeJwtClaims(newToken) ?? {};
    const mergedUser = {
      id: newUser?.id ?? claims.id,
      email: newUser?.email ?? claims.email,
      firstName: newUser?.firstName ?? claims.firstName,
      lastName: newUser?.lastName ?? claims.lastName,
      roles: newUser?.roles ?? claims.roles ?? ["ROLE_USER"],
      status: newUser?.status ?? claims.status ?? "active",
      language: newUser?.language ?? claims.language ?? "en",
      dashboardLayout:
        newUser?.dashboardLayout ?? claims.dashboardLayout ?? null,
      permissions: newUser?.permissions ?? claims.permissions ?? [],
    };

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));

    if (mergedUser.language) {
      localStorage.setItem(LANG_KEY, mergedUser.language);
    }
    setToken(newToken);
    setUser(mergedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // After login (or on every cold start with a stored token), fetch /auth/me to
  // get the server's current permissions for this user.  This ensures that if an
  // admin changed the user's role while they were away, the next page load
  // reflects the new permission set — no stale localStorage data.
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (!token || hasHydrated.current) return;
    hasHydrated.current = true;

    api
      .me()
      .then((data) => {
        if (!data?.user) return;
        const fresh = data.user;
        const updated = {
          id: fresh.id,
          email: fresh.email,
          firstName: fresh.firstName,
          lastName: fresh.lastName,
          roles: fresh.roles,
          status: fresh.status,
          language: fresh.language,
          dashboardLayout: fresh.dashboardLayout,
          permissions: fresh.permissions ?? [],
        };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        if (updated.language) {
          localStorage.setItem(LANG_KEY, updated.language);
        }
        setUser(updated);
      })
      .catch(() => {
        // Token is expired or invalid — clear stale session so the user is
        // redirected to /login by ProtectedRoute.
        logout();
      });
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
        hasPermission: (permission) => hasPermission(user, permission),
        hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
