import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "./auth.css";

export default function UsersList() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["ROLE_USER"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState([]);

  const canAssignRoles = hasPermission("users.assign_roles");

  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, settingsData] = await Promise.all([
          api.getUsers(),
          api.getAccessSettings(),
        ]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        if (
          Array.isArray(settingsData?.roles) &&
          settingsData.roles.length > 0
        ) {
          setRoles(settingsData.roles);
        }
      } catch (err) {
        setError(err.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const rows = useMemo(() => {
    return users.map((user) => ({
      ...user,
      role: user.roles?.[0] ?? "ROLE_USER",
    }));
  }, [users]);

  async function handleRoleChange(userId, role) {
    setPendingIds((prev) => [...prev, userId]);
    setError("");

    try {
      const data = await api.assignUserRole(userId, role);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...data.user } : user,
        ),
      );
    } catch (err) {
      setError(err.message || "Failed to assign role.");
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== userId));
    }
  }

  return (
    <section className="auth-users-section">
      <div className="auth-users-card">
        <h2>Users</h2>
        {error && <div className="auth-error">{error}</div>}

        {loading ? (
          <p className="auth-users-empty">Loading users…</p>
        ) : rows.length === 0 ? (
          <p className="auth-users-empty">No users found.</p>
        ) : (
          <div className="auth-users-table-wrap">
            <table className="auth-users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                        "—"}
                    </td>
                    <td>
                      {canAssignRoles ? (
                        <select
                          className="auth-select"
                          value={user.role}
                          disabled={pendingIds.includes(user.id)}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value)
                          }
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span>{user.role}</span>
                      )}
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("pl-PL")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
