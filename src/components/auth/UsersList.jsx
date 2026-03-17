import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/api";
import "./auth.css";

export default function UsersList({
  onSelectUser,
  onUsersChange,
  onEditUser,
  onDeleteUser,
  refreshKey = 0,
  selectedUserId,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    perPage,
    totalPages: 1,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!openMenuUserId) return;
    const close = () => { setOpenMenuUserId(null); setMenuPos(null); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenuUserId]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const usersData = await api.getUsers({ page, perPage, search });

        if (Array.isArray(usersData)) {
          setUsers(usersData);
          setPagination({
            total: usersData.length,
            page,
            perPage,
            totalPages: 1,
          });
        } else {
          setUsers(Array.isArray(usersData?.items) ? usersData.items : []);
          setPagination({
            total: Number(usersData?.pagination?.total ?? 0),
            page: Number(usersData?.pagination?.page ?? page),
            perPage: Number(usersData?.pagination?.perPage ?? perPage),
            totalPages: Math.max(
              1,
              Number(usersData?.pagination?.totalPages ?? 1),
            ),
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [page, perPage, refreshKey, search]);

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

  return (
    <>
      <section className="auth-users-section">
        <div className="auth-users-card">
        <div className="auth-users-card-header">
          <div>
            <h2>Directory</h2>
          </div>
        </div>

        <div className="auth-users-controls">
          <input
            type="search"
            className="auth-users-search"
            placeholder="Search by email or name"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <span className="auth-users-count">Total: {pagination.total}</span>
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
                      <span>{user.role}</span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("pl-PL")
                        : "—"}
                    </td>
                    <td
                      className={
                        openMenuUserId === user.id
                          ? "auth-users-actions-cell is-open"
                          : "auth-users-actions-cell"
                      }
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="auth-user-actions-wrap">
                        <button
                          type="button"
                          className="auth-kebab-btn"
                          aria-label="User actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (openMenuUserId === user.id) {
                              setOpenMenuUserId(null);
                              setMenuPos(null);
                              return;
                            }
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({
                              top: rect.bottom + 6,
                              right: window.innerWidth - rect.right,
                            });
                            setOpenMenuUserId(user.id);
                          }}
                        >
                          ⋯
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="auth-users-pagination">
            <button
              type="button"
              className="auth-pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <span className="auth-pagination-meta">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              className="auth-pagination-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.totalPages, current + 1),
                )
              }
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
    {openMenuUserId && menuPos &&
      createPortal(
        <div
          className="auth-kebab-menu auth-kebab-menu--fixed"
          style={{ top: menuPos.top, right: menuPos.right }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const u = rows.find((r) => r.id === openMenuUserId);
            if (!u) return null;
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpenMenuUserId(null);
                    setMenuPos(null);
                    onEditUser?.(u);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  disabled={u.status === "inactive"}
                  onClick={() => {
                    setOpenMenuUserId(null);
                    setMenuPos(null);
                    onDeleteUser?.(u);
                  }}
                >
                  Delete
                </button>
              </>
            );
          })()}
        </div>,
        document.body,
      )}
    </>
  );
}
