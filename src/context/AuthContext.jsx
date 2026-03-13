import React, { createContext, useContext, useState, useCallback } from "react";
import {
  decodeJwtClaims,
  hasAnyPermission,
  hasPermission,
} from "../auth/permissions";

const AuthContext = createContext(null);

const TOKEN_KEY = "dashboard_token";
const USER_KEY = "dashboard_user";

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
      permissions: newUser?.permissions ?? claims.permissions ?? [],
    };

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
    setToken(newToken);
    setUser(mergedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

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
