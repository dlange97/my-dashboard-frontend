import React from "react";
import "./auth.css";

function getDisplayName(user) {
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return fullName || "Unnamed user";
}

function getInitials(user) {
  const parts = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((value) => value.trim()[0]?.toUpperCase())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.slice(0, 2).join("");
  }

  return (user?.email ?? "U").slice(0, 2).toUpperCase();
}

export default function UserProfileCard({
  user,
  loading = false,
  error = "",
  canEdit = false,
  editMode = false,
  availableRoles = ["ROLE_USER"],
  onSave,
  onCancelEdit,
}) {
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "ROLE_USER",
  });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");

  React.useEffect(() => {
    setForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      role: user?.role ?? user?.roles?.[0] ?? "ROLE_USER",
    });
    setSaveError("");
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user?.id || !onSave) return;

    setSaving(true);
    setSaveError("");
    try {
      await onSave(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
      });
    } catch (err) {
      setSaveError(err.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  }

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  if (loading) {
    return (
      <aside className="auth-users-profile-card auth-users-profile-empty">
        <p className="auth-users-profile-kicker">User profile</p>
        <h2>Loading profile</h2>
        <p>Fetching the latest user details from the backend.</p>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="auth-users-profile-card auth-users-profile-empty">
        <p className="auth-users-profile-kicker">User profile</p>
        <h2>Cannot load profile</h2>
        <p>{error}</p>
      </aside>
    );
  }

  if (!user) {
    return (
      <aside className="auth-users-profile-card auth-users-profile-empty">
        <p className="auth-users-profile-kicker">User profile</p>
        <h2>Select a user</h2>
        <p>
          Click any user in the list to preview account details, assigned role,
          and effective permissions.
        </p>
      </aside>
    );
  }

  const displayName = getDisplayName(user);
  const role = user.role ?? user.roles?.[0] ?? "ROLE_USER";
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const status = user.status === "inactive" ? "Inactive" : "Active";

  return (
    <aside className="auth-users-profile-card">
      <p className="auth-users-profile-kicker">User profile</p>

      <div className="auth-users-profile-hero">
        <div className="auth-users-avatar">{getInitials(user)}</div>
        <div>
          <h2>{displayName}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      {canEdit && editMode ? (
        <form className="auth-users-profile-edit-form" onSubmit={handleSubmit}>
          {saveError && <div className="auth-error">{saveError}</div>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profileFirstName">First name</label>
              <input
                id="profileFirstName"
                value={form.firstName}
                onChange={(event) => setField("firstName", event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="profileLastName">Last name</label>
              <input
                id="profileLastName"
                value={form.lastName}
                onChange={(event) => setField("lastName", event.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profileEmail">Email</label>
            <input
              id="profileEmail"
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profileRole">Role</label>
            <select
              id="profileRole"
              className="auth-select"
              value={form.role}
              onChange={(event) => setField("role", event.target.value)}
            >
              {availableRoles.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-users-profile-edit-actions">
            <button
              type="button"
              className="btn-muted"
              onClick={onCancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="auth-users-profile-section">
        <h3>Account</h3>
        <dl className="auth-users-meta-list">
          <div>
            <dt>Role</dt>
            <dd>{role}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user.id}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>
              {user.createdAt
                ? new Date(user.createdAt).toLocaleString("pl-PL")
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{status}</dd>
          </div>
        </dl>
      </div>

      <div className="auth-users-profile-section">
        <h3>Permissions</h3>
        {permissions.length === 0 ? (
          <p className="auth-users-profile-muted">
            This user has no effective permissions.
          </p>
        ) : (
          <div className="auth-users-permission-list">
            {permissions.map((permission) => (
              <span key={permission} className="auth-users-permission-chip">
                {permission}
              </span>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
