import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import "./auth.css";

export default function UsersList({
  onSelectUser,
  onUsersChange,
  onEditUser,
  onDeleteUser,
  refreshKey = 0,
  selectedUserId,
}) {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(["ROLE_USER"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState([]);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  const canAssignRoles = hasPermission("users.assign_roles");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

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
  }, [refreshKey]);

  const rows = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        role: user.roles?.[0] ?? "ROLE_USER",
      })),
    [users],
  );

  useEffect(() => {
    onUsersChange?.(rows);
  }, [onUsersChange, rows]);

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
        <div className="auth-users-card-header">
          <div>
            <h2>Directory</h2>
            <p className="auth-users-card-subtitle">
              Select a user to inspect the profile on the right.
            </p>
          </div>
        </div>

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
                  <th>Status</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <tr
                    key={user.id}
                    className={
                      selectedUserId === user.id
                        ? "auth-users-row is-selected"
                        : "auth-users-row"
                    }
                    onClick={() => onSelectUser?.(user)}
                  >
                    <td>{user.email}</td>
                    <td>
                      <div className="auth-users-name-cell">
                        <strong>
                          {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                            "—"}
                        </strong>
                        <span>Open profile</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`auth-user-status-chip ${
                          user.status === "inactive"
                            ? "is-inactive"
                            : "is-active"
                        }`}
                      >
                        {user.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td>
                      {canAssignRoles ? (
                        <select
                          className="auth-select"
                          value={user.role}
                          disabled={pendingIds.includes(user.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleRoleChange(user.id, event.target.value)
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
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="auth-user-actions-wrap">
                        <button
                          type="button"
                          className="auth-kebab-btn"
                          aria-label="User actions"
                          onClick={() =>
                            setOpenMenuUserId((current) =>
                              current === user.id ? null : user.id,
                            )
                          }
                        >
                          ⋯
                        </button>

                        {openMenuUserId === user.id && (
                          <div className="auth-kebab-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuUserId(null);
                                onEditUser?.(user);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="is-danger"
                              disabled={user.status === "inactive"}
                              onClick={() => {
                                setOpenMenuUserId(null);
                                onDeleteUser?.(user);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
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
