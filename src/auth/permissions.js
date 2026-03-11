export function decodeJwtClaims(token) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function hasPermission(user, permission) {
  if (!permission) return true;
  const permissions = user?.permissions ?? [];
  return permissions.includes(permission);
}

export function hasAnyPermission(user, permissionList = []) {
  const permissions = user?.permissions ?? [];
  return permissionList.some((permission) => permissions.includes(permission));
}
