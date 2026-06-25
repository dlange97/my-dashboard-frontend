import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  decodeJwtClaims,
  hasAnyPermission,
  hasPermission,
} from "../auth/permissions";
import api from "../api/api";

const AuthContext = createContext(null);

// TOKEN_KEY is no longer written to localStorage — the JWT is stored as an
// httpOnly cookie by the auth-service. We keep the constant only to migrate
// away any previously stored value on first load.
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
  // We no longer persist the raw JWT in localStorage.
  // isAuthenticated is derived from whether `user` is populated.
  // On cold start we call /auth/me — if the httpOnly cookie is still valid the
  // server returns the current user; if not, the user is treated as logged out.
  const [user, setUser] = useState(() => {
    // Migrate: clear any token that was stored by a previous version.
    localStorage.removeItem(TOKEN_KEY);

    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [needsInstanceSelection, setNeedsInstanceSelection] = useState(false);
  // isReady: false until the initial /auth/me check completes, so we don't
  // flash a login screen while the cookie-based session is being verified.
  const [isReady, setIsReady] = useState(false);

  const login = useCallback((newToken, newUser) => {
    // The actual JWT is stored as an httpOnly cookie by the auth-service.
    // We decode the token body here only to extract user claims immediately,
    // so the UI can render without waiting for a /auth/me round-trip.
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

    // Store only non-sensitive user profile data — never the raw token.
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
    // Ask the server to clear the httpOnly cookie.
    api.logout().catch(() => {});
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(INSTANCE_KEY);
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

  // On cold start: call /auth/me to verify the httpOnly cookie is still valid
  // and refresh the user's permissions from the server.
  const hasHydrated = useRef(false);
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    api
      .me()
      .then((data) => {
        if (!data?.user) {
          setUser(null);
          setIsReady(true);
          return;
        }

        const fresh = data.user;
        // Prefer instanceId already stored in localStorage (set during previous
        // session or by subdomain resolver) over whatever /auth/me may return.
        const resolvedInstanceId =
          user?.instanceId ?? localStorage.getItem(INSTANCE_KEY) ?? null;

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
          instanceId: resolvedInstanceId,
        };

        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        if (updated.language) {
          localStorage.setItem(LANG_KEY, updated.language);
        }
        setUser(updated);

        // If instanceId is still missing, auto-discover it before marking the
        // app as ready. This mirrors the same logic in login() so that a page
        // refresh never results in API requests missing X-Instance-Id header.
        if (!resolvedInstanceId) {
          api
            .getMyInstances()
            .then((instances) => {
              if (instances && instances.length === 1) {
                localStorage.setItem(INSTANCE_KEY, instances[0].id);
                setUser((prev) =>
                  prev ? { ...prev, instanceId: instances[0].id } : prev,
                );
                setNeedsInstanceSelection(false);
              } else if (instances && instances.length > 1) {
                setNeedsInstanceSelection(true);
              }
            })
            .catch(() => {
              // Instance discovery is best-effort.
            })
            .finally(() => {
              setIsReady(true);
            });
        } else {
          setIsReady(true);
        }
      })
      .catch(() => {
        // Cookie expired or invalid — treat as logged out.
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setIsReady(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      selectInstance,
      needsInstanceSelection,
      isReady,
      isAuthenticated: !!user,
      hasPermission: (permission) => hasPermission(user, permission),
      hasAnyPermission: (permissions) => hasAnyPermission(user, permissions),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, login, logout, selectInstance, needsInstanceSelection, isReady],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
