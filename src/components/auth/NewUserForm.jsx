import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Button } from "../ui";
import "./auth.css";

function getDefaultRole(roles) {
  return roles.includes("ROLE_USER") ? "ROLE_USER" : (roles[0] ?? "ROLE_USER");
}

export default function NewUserForm({ onCancel, onCreated }) {
  const [roles, setRoles] = useState(["ROLE_USER"]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    role: "ROLE_USER",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getAccessSettings()
      .then((data) => {
        if (Array.isArray(data?.roles) && data.roles.length > 0) {
          setRoles(data.roles);
          setForm((current) => ({
            ...current,
            role: data.roles.includes(current.role)
              ? current.role
              : getDefaultRole(data.roles),
          }));
        }
      })
      .catch(() => {});
  }, []);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.createUser({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
      });

      setSuccess(`User ${form.email.trim()} created successfully.`);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm: "",
        role: getDefaultRole(roles),
      });

      onCreated?.(data.user);
    } catch (err) {
      setError(err.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-manage-section">
      <div className="auth-manage-card auth-manage-card-embedded">
        <h1>Create New User</h1>
        <p className="auth-manage-subtitle">
          Add a new application account only when you need it, then return to
          the selected profile view.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Jan"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Kowalski"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="new.user@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="auth-select"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-manage-actions">
            <Button variant="secondary" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button loading={loading} type="submit">
              {loading ? "Creating user…" : "Create user"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
