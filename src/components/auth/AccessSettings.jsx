import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";

function RoleModal({
  title,
  initial,
  allPermissions,
  saving,
  error,
  lockSlug = false,
  lockPermissions = false,
  onSave,
  onClose,
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [perms, setPerms] = useState(new Set(initial.permissions ?? []));

  function togglePermission(permission) {
    if (lockPermissions) return;

    setPerms((current) => {
      const next = new Set(current);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
  }

  function autoSlug(value) {
    return (
      "ROLE_" +
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
    );
  }

  function handleNameChange(value) {
    setName(value);
    if (!lockSlug) {
      setSlug(autoSlug(value));
    }
  }

  return (
    <div className="role-modal-overlay" onClick={onClose}>
      <div className="role-modal" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>

        {error && <div className="role-modal-error">{error}</div>}

        <label>Role name</label>
        <input
          type="text"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          placeholder="Example: Custom Viewer"
          maxLength={100}
          autoFocus
        />

        <label>Role slug</label>
        <input
          type="text"
          value={slug}
          onChange={(event) =>
            setSlug(event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
          }
          placeholder="ROLE_CUSTOM_VIEWER"
          maxLength={100}
          disabled={lockSlug}
        />

        <label>Permissions</label>
        <div className="perm-checkboxes">
          {allPermissions.map((permission) => (
            <label key={permission} className="perm-checkbox-item">
              <input
                type="checkbox"
                checked={perms.has(permission)}
                onChange={() => togglePermission(permission)}
                disabled={lockPermissions}
              />
              {permission}
            </label>
          ))}
        </div>

        <div className="role-modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saving || !name.trim() || !slug.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                slug: slug.trim(),
                permissions: [...perms],
              })
            }
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ role, allPermissions, onEdit, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`role-card${role.isSystem ? " system" : ""}`}>
      <div className="role-card-header">
        <div className="role-card-title">
          <div className="role-card-name">{role.name}</div>
          <div className="role-card-slug">{role.slug}</div>
        </div>

        <div className="role-card-header-actions">
          <span
            className={
              role.isSystem ? "role-badge-system" : "role-badge-custom"
            }
          >
            {role.isSystem ? "System" : "Custom"}
          </span>

          <div className="role-actions-menu-wrap">
            <button
              type="button"
              className="role-actions-dots"
              aria-label="Role actions"
              onClick={() => setMenuOpen((current) => !current)}
            >
              ⋯
            </button>

            {menuOpen && (
              <div className="role-actions-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(role);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(role);
                  }}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  disabled={
                    role.isSystem || Number(role.assignedUsersCount) > 0
                  }
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(role);
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="role-meta-line">
        Assigned users: {Number(role.assignedUsersCount ?? 0)}
      </div>

      <div className="role-permissions-list">
        {allPermissions.map((permission) => (
          <span
            key={permission}
            className={`perm-tag${role.permissions.includes(permission) ? " active" : ""}`}
          >
            {permission}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AccessSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allPermissions, setAllPermissions] = useState([]);
  const [roleDefinitions, setRoleDefinitions] = useState([]);
  const [modal, setModal] = useState(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");

    api
      .getAccessSettings()
      .then((data) => {
        setAllPermissions(
          Array.isArray(data?.permissions) ? data.permissions : [],
        );

        if (Array.isArray(data?.roleDefinitions)) {
          setRoleDefinitions(data.roleDefinitions);
          return;
        }

        const fallback = (data?.roles ?? []).map((slug) => ({
          id: null,
          name: slug,
          slug,
          permissions: data?.rolePermissions?.[slug] ?? [],
          isSystem: true,
          assignedUsersCount: 0,
        }));
        setRoleDefinitions(fallback);
      })
      .catch((err) => setError(err.message || "Unable to load role settings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(payload) {
    setModal((current) => ({ ...current, saving: true, error: "" }));
    try {
      const created = await api.createRole(payload);
      setRoleDefinitions((current) => [...current, created]);
      setModal(null);
    } catch (err) {
      setModal((current) => ({
        ...current,
        saving: false,
        error: err.message || "Failed to create role.",
      }));
    }
  }

  async function handleUpdate(roleId, payload) {
    setModal((current) => ({ ...current, saving: true, error: "" }));
    try {
      const updated = await api.updateRole(roleId, payload);
      setRoleDefinitions((current) =>
        current.map((role) =>
          role.id === roleId ? { ...role, ...updated } : role,
        ),
      );
      setModal(null);
    } catch (err) {
      setModal((current) => ({
        ...current,
        saving: false,
        error: err.message || "Failed to update role.",
      }));
    }
  }

  async function handleDelete(role) {
    const assignedCount = Number(role.assignedUsersCount ?? 0);
    if (role.isSystem || assignedCount > 0) {
      return;
    }

    if (!window.confirm(`Remove role \"${role.name}\"?`)) {
      return;
    }

    try {
      await api.deleteRole(role.id);
      setRoleDefinitions((current) =>
        current.filter((item) => item.id !== role.id),
      );
    } catch (err) {
      setError(err.message || "Failed to remove role.");
    }
  }

  function openCreateModal() {
    setModal({
      mode: "create",
      roleId: null,
      initial: {
        name: "",
        slug: "",
        permissions: [],
      },
      lockSlug: false,
      lockPermissions: false,
      saving: false,
      error: "",
    });
  }

  function openEditModal(role) {
    setModal({
      mode: "edit",
      roleId: role.id,
      initial: {
        name: role.name,
        slug: role.slug,
        permissions: role.permissions ?? [],
      },
      lockSlug: Boolean(role.isSystem),
      lockPermissions: Boolean(role.isSystem),
      saving: false,
      error: "",
    });
  }

  function openDuplicateModal(role) {
    setModal({
      mode: "create",
      roleId: null,
      initial: {
        name: `${role.name} Copy`,
        slug: `${role.slug}_COPY`,
        permissions: [...(role.permissions ?? [])],
      },
      lockSlug: false,
      lockPermissions: false,
      saving: false,
      error: "",
    });
  }

  return (
    <div className="access-settings-inner">
      <div className="access-settings-header">
        <h3>Roles and permissions</h3>
        <button className="btn-add-role" onClick={openCreateModal}>
          + New role
        </button>
      </div>

      {error && (
        <div className="role-modal-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading...</p>
      ) : (
        <div className="roles-grid">
          {roleDefinitions.map((role, index) => (
            <RoleCard
              key={role.id ?? `${role.slug}-${index}`}
              role={role}
              allPermissions={allPermissions}
              onEdit={openEditModal}
              onDuplicate={openDuplicateModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <RoleModal
          title={modal.mode === "create" ? "Create role" : "Edit role"}
          initial={modal.initial}
          allPermissions={allPermissions}
          lockSlug={modal.lockSlug}
          lockPermissions={modal.lockPermissions}
          saving={modal.saving}
          error={modal.error}
          onSave={(payload) =>
            modal.mode === "create"
              ? handleCreate(payload)
              : handleUpdate(modal.roleId, payload)
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
