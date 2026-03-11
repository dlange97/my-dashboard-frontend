import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/api";

// ── Role Editor Modal ─────────────────────────────────────────────────────
function RoleModal({
  title,
  initial,
  allPermissions,
  saving,
  error,
  onSave,
  onClose,
}) {
  const [name, setName] = useState(initial.name ?? "");
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [perms, setPerms] = useState(new Set(initial.permissions ?? []));

  function togglePerm(p) {
    setPerms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  function autoSlug(n) {
    return (
      "ROLE_" +
      n
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
    );
  }

  function handleNameChange(val) {
    setName(val);
    if (!initial.isSlugLocked) {
      setSlug(autoSlug(val));
    }
  }

  return (
    <div className="role-modal-overlay" onClick={onClose}>
      <div className="role-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>

        {error && <div className="role-modal-error">{error}</div>}

        <label>Nazwa roli</label>
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="np. Custom Viewer"
          maxLength={100}
          autoFocus
        />

        {!initial.isSlugLocked && (
          <>
            <label>Slug (identyfikator)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))
              }
              placeholder="ROLE_CUSTOM_..."
              maxLength={100}
            />
          </>
        )}

        <label>Uprawnienia</label>
        <div className="perm-checkboxes">
          {allPermissions.map((p) => (
            <label key={p} className="perm-checkbox-item">
              <input
                type="checkbox"
                checked={perms.has(p)}
                onChange={() => togglePerm(p)}
              />
              {p}
            </label>
          ))}
        </div>

        <div className="role-modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={saving}>
            Anuluj
          </button>
          <button
            className="btn-primary"
            disabled={saving || !name.trim()}
            onClick={() =>
              onSave({ name: name.trim(), slug, permissions: [...perms] })
            }
          >
            {saving ? "Zapisywanie…" : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role Card ─────────────────────────────────────────────────────────────
function RoleCard({ role, allPermissions, onDuplicate, onRename, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(role.name);
  const [renameError, setRenameError] = useState("");

  async function submitRename() {
    if (!newName.trim()) return;
    try {
      await onRename(role.id, newName.trim());
      setRenaming(false);
    } catch (err) {
      setRenameError(err.message);
    }
  }

  return (
    <div className={`role-card${role.isSystem ? " system" : ""}`}>
      <div className="role-card-header">
        <div className="role-card-title">
          {renaming && !role.isSystem ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #6366f1",
                  fontSize: "0.85rem",
                  flex: 1,
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") {
                    setRenaming(false);
                    setNewName(role.name);
                  }
                }}
              />
              <button
                className="btn-rename"
                style={{ padding: "3px 9px" }}
                onClick={submitRename}
              >
                ✓
              </button>
              <button
                className="btn-secondary"
                style={{
                  padding: "3px 9px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                }}
                onClick={() => {
                  setRenaming(false);
                  setNewName(role.name);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <div className="role-card-name">{role.name}</div>
              <div className="role-card-slug">{role.slug}</div>
            </>
          )}
          {renameError && (
            <div
              style={{ color: "#dc2626", fontSize: "0.72rem", marginTop: 3 }}
            >
              {renameError}
            </div>
          )}
        </div>
        <span
          className={role.isSystem ? "role-badge-system" : "role-badge-custom"}
        >
          {role.isSystem ? "System" : "Custom"}
        </span>
      </div>

      <div className="role-permissions-list">
        {allPermissions.map((p) => (
          <span
            key={p}
            className={`perm-tag${role.permissions.includes(p) ? " active" : ""}`}
          >
            {p}
          </span>
        ))}
      </div>

      <div className="role-card-actions">
        <button
          className="btn-duplicate"
          onClick={() => onDuplicate(role)}
          title="Duplikuj rolę"
        >
          ⎘ Duplikuj
        </button>
        {!role.isSystem && (
          <>
            <button
              className="btn-rename"
              onClick={() => setRenaming(true)}
              title="Zmień nazwę"
            >
              ✏️ Nazwa
            </button>
            <button
              className="btn-delete-role"
              onClick={() => {
                if (window.confirm(`Usunąć rolę "${role.name}"?`))
                  onDelete(role.id);
              }}
              title="Usuń rolę"
            >
              🗑 Usuń
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── AccessSettings ────────────────────────────────────────────────────────
export default function AccessSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allPermissions, setAllPermissions] = useState([]);
  const [roleDefinitions, setRoleDefinitions] = useState([]);
  const [modal, setModal] = useState(null); // { mode: "create"|"edit", initial, saving, error }

  const loadData = useCallback(() => {
    setLoading(true);
    api
      .getAccessSettings()
      .then((data) => {
        setAllPermissions(data?.permissions ?? []);
        // Prefer roleDefinitions from new API field; fall back to old format
        if (Array.isArray(data?.roleDefinitions)) {
          setRoleDefinitions(data.roleDefinitions);
        } else {
          // legacy fallback
          const defs = (data?.roles ?? []).map((slug) => ({
            id: null,
            name: slug,
            slug,
            permissions: data?.rolePermissions?.[slug] ?? [],
            isSystem: true,
          }));
          setRoleDefinitions(defs);
        }
      })
      .catch((err) =>
        setError(err.message || "Nie udało się załadować ustawień."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleDuplicate(sourceRole) {
    const initial = {
      name: `${sourceRole.name} (kopia)`,
      slug: `${sourceRole.slug}_COPY`,
      permissions: [...sourceRole.permissions],
      isSlugLocked: false,
    };
    setModal({ mode: "create", initial, saving: false, error: "" });
  }

  async function handleCreate(data) {
    setModal((m) => ({ ...m, saving: true, error: "" }));
    try {
      const created = await api.createRole(data);
      setRoleDefinitions((prev) => [...prev, created]);
      setModal(null);
    } catch (err) {
      setModal((m) => ({
        ...m,
        saving: false,
        error: err.message || "Błąd tworzenia roli.",
      }));
    }
  }

  async function handleRename(id, name) {
    const updated = await api.updateRole(id, { name });
    setRoleDefinitions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: updated.name ?? name } : r)),
    );
  }

  async function handleDelete(id) {
    await api.deleteRole(id);
    setRoleDefinitions((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="access-settings-inner">
      <div className="access-settings-header">
        <h3>Role i uprawnienia</h3>
        <button
          className="btn-add-role"
          onClick={() =>
            setModal({
              mode: "create",
              initial: {
                name: "",
                slug: "",
                permissions: [],
                isSlugLocked: false,
              },
              saving: false,
              error: "",
            })
          }
        >
          + Nowa rola
        </button>
      </div>

      {error && (
        <div className="role-modal-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Ładowanie…</p>
      ) : (
        <div className="roles-grid">
          {roleDefinitions.map((role, idx) => (
            <RoleCard
              key={role.id ?? `${role.slug}-${idx}`}
              role={role}
              allPermissions={allPermissions}
              onDuplicate={handleDuplicate}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <RoleModal
          title={modal.mode === "create" ? "Utwórz nową rolę" : "Edytuj rolę"}
          initial={modal.initial}
          allPermissions={allPermissions}
          saving={modal.saving}
          error={modal.error}
          onSave={handleCreate}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
