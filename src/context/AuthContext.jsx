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
const INSTANCE_KEY = "dashboard_instance_id";

const APP_DOMAIN = "mydashboard";

/** Extract the subdomain from the browser hostname, e.g. "lange" from "lange.mydashboard.local". */
function extractSubdomain() {
  if (typeof window === "undefined") return null;
  const { hostname } = window.location;
  const match = hostname.match(
    new RegExp(`^([a-z0-9-]+)\\.${APP_DOMAIN}\\.(local|com)$`),
  );
  return match ? match[1] : null;
}

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

  const [needsInstanceSelection, setNeedsInstanceSelection] = useState(false);

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
      instanceId: newUser?.instanceId ?? claims.instanceId ?? null,
    };

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));

    if (mergedUser.language) {
      localStorage.setItem(LANG_KEY, mergedUser.language);
    }
    if (mergedUser.instanceId) {
      localStorage.setItem(INSTANCE_KEY, mergedUser.instanceId);
      setNeedsInstanceSelection(false);
    } else {
      localStorage.removeItem(INSTANCE_KEY);
    }
    setToken(newToken);
    setUser(mergedUser);

    // If the JWT has no instanceId, check how many instances the user has
    if (!mergedUser.instanceId) {
      api
        .getMyInstances()
        .then((instances) => {
          if (instances && instances.length === 1) {
            // Auto-select the only instance
            localStorage.setItem(INSTANCE_KEY, instances[0].id);
            setUser((prev) => ({ ...prev, instanceId: instances[0].id }));
            setNeedsInstanceSelection(false);
          } else if (instances && instances.length > 1) {
            setNeedsInstanceSelection(true);
          }
        })
        .catch(() => {
          // Ignore — instance selection can be retried
        });
    }
  }, []);

  const selectInstance = useCallback((instanceId) => {
    localStorage.setItem(INSTANCE_KEY, instanceId);
    setUser((prev) => (prev ? { ...prev, instanceId } : prev));
    setNeedsInstanceSelection(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(INSTANCE_KEY);
    setToken(null);
    setUser(null);
    setNeedsInstanceSelection(false);
  }, []);

  // Resolve instanceId from subdomain on first load (before login)
  const subdomainResolved = useRef(false);
  useEffect(() => {
    if (subdomainResolved.current) return;
    subdomainResolved.current = true;

    const stored = localStorage.getItem(INSTANCE_KEY);
    if (stored) return; // already have an instance

    const subdomain = extractSubdomain();
    if (!subdomain) return;

    api
      .resolveInstanceBySubdomain(subdomain)
      .then((data) => {
        if (data?.id) {
          localStorage.setItem(INSTANCE_KEY, data.id);
          setUser((prev) => (prev ? { ...prev, instanceId: data.id } : prev));
        }
      })
      .catch(() => {
        // Subdomain doesn't match any instance — ignore
      });
  }, []);

  // After login (or on every cold start with a stored token), fetch /auth/me to
  // get the server's current permissions for this user.
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
          instanceId: user?.instanceId ?? localStorage.getItem(INSTANCE_KEY),
        };
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        if (updated.language) {
          localStorage.setItem(LANG_KEY, updated.language);
        }
        setUser(updated);
      })
      .catch(() => {
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
        selectInstance,
        needsInstanceSelection,
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
