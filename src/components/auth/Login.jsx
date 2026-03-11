import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import "./auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setRequestSuccess("");
    setLoginLoading(true);

    try {
      const data = await api.login(email.trim(), password);

      login(data.token, data.user ?? { email });
      navigate("/");
    } catch (err) {
      setError(err.message || "Network error. Is the server running?");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRequestAccess(e) {
    e.preventDefault();
    setError("");
    setRequestSuccess("");

    if (!email.trim()) {
      setError("Enter your email before sending request access.");
      return;
    }

    setRequestLoading(true);
    try {
      await api.requestAccess({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        message: requestMessage.trim(),
      });
      setRequestSuccess("Request access sent. Admin will review your request.");
      setShowRequestForm(false);
      setFirstName("");
      setLastName("");
      setRequestMessage("");
    } catch (err) {
      setError(err.message || "Failed to send request access.");
    } finally {
      setRequestLoading(false);
    }
  }

  const openRequestView = () => {
    setError("");
    setRequestSuccess("");
    setView("request");
  };

  const openLoginView = () => {
    setError("");
    setRequestSuccess("");
    setView("login");
  };

  return (
    <div className="auth-page">
      <div
        className={`auth-card${view === "request" ? " auth-card-request" : ""}`}
      >
        {view === "login" ? (
          <>
            <h2>My Dashboard</h2>
            <p className="auth-subtitle">Sign in to your account</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}
              {requestSuccess && (
                <div className="auth-success">{requestSuccess}</div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="auth-password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                className="auth-btn"
                type="submit"
                disabled={loginLoading || requestLoading}
              >
                {loginLoading ? "Signing in…" : "Sign In"}
              </button>

              <button
                className="auth-btn auth-btn-secondary"
                type="button"
                disabled={loginLoading || requestLoading}
                onClick={openRequestView}
              >
                Request Access
              </button>
            </form>

            <p className="auth-footer">
              Account creation is managed by administrators.
            </p>
          </>
        ) : (
          <>
            <div className="auth-request-header">
              <h2>Request Access</h2>
              <button
                type="button"
                className="auth-request-back-btn"
                onClick={openLoginView}
                disabled={requestLoading}
              >
                ← Back to login
              </button>
            </div>
            <p className="auth-subtitle">
              Send your details to administrator for approval.
            </p>

            <form className="auth-request-form" onSubmit={handleRequestAccess}>
              {error && <div className="auth-error">{error}</div>}
              {requestSuccess && (
                <div className="auth-success">{requestSuccess}</div>
              )}

              <div className="form-group">
                <label htmlFor="requestEmail">Email *</label>
                <input
                  id="requestEmail"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First name (optional)</label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Jan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last name (optional)</label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Kowalski"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="requestMessage">Request access message</label>
                <textarea
                  id="requestMessage"
                  className="auth-login-textarea"
                  placeholder="Napisz krótką wiadomość do administratora..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>

              <div className="auth-request-actions">
                <button
                  className="auth-btn auth-btn-secondary"
                  type="button"
                  disabled={requestLoading}
                  onClick={openLoginView}
                >
                  Cancel
                </button>
                <button
                  className="auth-btn"
                  type="submit"
                  disabled={requestLoading}
                >
                  {requestLoading ? "Sending…" : "Send Request"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
