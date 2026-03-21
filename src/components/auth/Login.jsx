import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/TranslationContext";
import api from "../../api/api";
import "./auth.css";

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
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
      setError(
        err.message ||
          t("login.networkError", "Network error. Is the server running?"),
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRequestAccess(e) {
    e.preventDefault();
    setError("");
    setRequestSuccess("");

    if (!email.trim()) {
      setError(
        t(
          "login.emailRequired",
          "Enter your email before sending request access.",
        ),
      );
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
      setRequestSuccess(
        t(
          "login.requestSent",
          "Request access sent. Admin will review your request.",
        ),
      );
      setView("login");
      setFirstName("");
      setLastName("");
      setRequestMessage("");
    } catch (err) {
      setError(
        err.message ||
          t("login.requestFailed", "Failed to send request access."),
      );
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
            <h2>{t("nav.brand", "My Dashboard")}</h2>
            <p className="auth-subtitle">
              {t("login.subtitle", "Sign in to your account")}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}
              {requestSuccess && (
                <div className="auth-success">{requestSuccess}</div>
              )}

              <div className="form-group">
                <label htmlFor="email">{t("login.email", "Email")}</label>
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
                <label htmlFor="password">
                  {t("login.password", "Password")}
                </label>
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
                      showPassword
                        ? t("login.hidePassword", "Hide password")
                        : t("login.showPassword", "Show password")
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
                {loginLoading
                  ? t("login.signingIn", "Signing in…")
                  : t("login.signIn", "Sign In")}
              </button>

              <button
                className="auth-btn auth-btn-secondary"
                type="button"
                disabled={loginLoading || requestLoading}
                onClick={openRequestView}
              >
                {t("login.requestAccess", "Request Access")}
              </button>
            </form>

            <p className="auth-footer">
              {t(
                "login.footerNote",
                "Account creation is managed by administrators.",
              )}
            </p>
          </>
        ) : (
          <>
            <div className="auth-request-header">
              <h2>{t("login.requestAccess", "Request Access")}</h2>
              <button
                type="button"
                className="auth-request-back-btn"
                onClick={openLoginView}
                disabled={requestLoading}
              >
                {t("login.backToLogin", "← Back to login")}
              </button>
            </div>
            <p className="auth-subtitle">
              {t(
                "login.requestSubtitle",
                "Send your details to administrator for approval.",
              )}
            </p>

            <form className="auth-request-form" onSubmit={handleRequestAccess}>
              {error && <div className="auth-error">{error}</div>}
              {requestSuccess && (
                <div className="auth-success">{requestSuccess}</div>
              )}

              <div className="form-group">
                <label htmlFor="requestEmail">
                  {t("login.email", "Email")} *
                </label>
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
                  <label htmlFor="firstName">
                    {t("login.firstName", "First name")} (
                    {t("common.optional", "optional")})
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Jan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">
                    {t("login.lastName", "Last name")} (
                    {t("common.optional", "optional")})
                  </label>
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
                <label htmlFor="requestMessage">
                  {t("login.requestMessage", "Request access message")}
                </label>
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
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  className="auth-btn"
                  type="submit"
                  disabled={requestLoading}
                >
                  {requestLoading
                    ? t("login.sending", "Sending…")
                    : t("login.sendRequest", "Send Request")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
