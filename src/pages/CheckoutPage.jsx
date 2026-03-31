import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = ((import.meta.env.VITE_API_BASE_URL ?? "").trim() || "http://localhost:8081");

export default function CheckoutPage() {
  const { hash } = useParams();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [instanceName, setInstanceName] = useState("");
  const [instanceSubdomain, setInstanceSubdomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function validateHash() {
      try {
        const res = await fetch(`${API_BASE}/auth/checkout/${hash}/validate`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.valid) {
          setValid(true);
        } else {
          setValidationError(data.reason ?? "This invite link is invalid or has already been used.");
        }
      } catch {
        setValidationError("Failed to validate invite link. Is the server running?");
      } finally {
        setValidating(false);
      }
    }
    validateHash();
  }, [hash]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/checkout/${hash}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName,
          instanceSubdomain,
          adminEmail,
          adminPassword,
          adminFirstName: adminFirstName || undefined,
          adminLastName: adminLastName || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Checkout failed. Please try again.");
        return;
      }

      setSuccess({
        subdomain: data.subdomain,
        token: data.token,
      });
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="checkout-page checkout-loading">
        <p>Validating invite link…</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="checkout-page checkout-invalid">
        <h1>Invalid Invite</h1>
        <p>{validationError}</p>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="checkout-page checkout-success">
        <h1>&#127881; Instance Created!</h1>
        <p>
          Your instance <strong>{success.subdomain}</strong> is ready.
          You are now logged in as the admin.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => {
            localStorage.setItem("dashboard_token", success.token);
            navigate("/");
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <h1 className="checkout-title">Set Up Your Instance</h1>
        <p className="checkout-subtitle">
          Fill in the details below to create your account and instance.
        </p>

        {error && <div className="checkout-error">{error}</div>}

        <form onSubmit={handleSubmit} className="checkout-form" noValidate>
          <fieldset>
            <legend>Instance Details</legend>

            <label htmlFor="instanceName">Instance Name *</label>
            <input
              id="instanceName"
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="Acme Corp"
              required
              disabled={loading}
            />

            <label htmlFor="instanceSubdomain">Subdomain *</label>
            <div className="subdomain-input-wrapper">
              <input
                id="instanceSubdomain"
                type="text"
                value={instanceSubdomain}
                onChange={(e) =>
                  setInstanceSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="acme"
                required
                disabled={loading}
                maxLength={63}
              />
              <span className="subdomain-suffix">.mydashboard.local</span>
            </div>
          </fieldset>

          <fieldset>
            <legend>Admin Account</legend>

            <label htmlFor="adminFirstName">First Name</label>
            <input
              id="adminFirstName"
              type="text"
              value={adminFirstName}
              onChange={(e) => setAdminFirstName(e.target.value)}
              placeholder="Jane"
              disabled={loading}
            />

            <label htmlFor="adminLastName">Last Name</label>
            <input
              id="adminLastName"
              type="text"
              value={adminLastName}
              onChange={(e) => setAdminLastName(e.target.value)}
              placeholder="Doe"
              disabled={loading}
            />

            <label htmlFor="adminEmail">Email *</label>
            <input
              id="adminEmail"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />

            <label htmlFor="adminPassword">Password * (min. 8 characters)</label>
            <input
              id="adminPassword"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              disabled={loading}
            />
          </fieldset>

          <button
            type="submit"
            className="btn btn-primary checkout-submit"
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Instance"}
          </button>
        </form>
      </div>
    </div>
  );
}
