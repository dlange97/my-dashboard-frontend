import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "../context/TranslationContext";
import api from "../api/api";

export default function SetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function validateToken() {
      try {
        const data = await api.validateInvite(token);
        if (!active) return;
        if (data?.valid) {
          setValid(true);
          setEmail(data.email ?? "");
        } else {
          setValidationError(
            data?.reason ??
              t(
                "setPassword.invalid",
                "This invitation link is invalid or has already been used.",
              ),
          );
        }
      } catch (err) {
        if (!active) return;
        setValidationError(
          err.message ||
            t(
              "setPassword.invalid",
              "This invitation link is invalid or has already been used.",
            ),
        );
      } finally {
        if (active) setValidating(false);
      }
    }
    validateToken();
    return () => {
      active = false;
    };
  }, [token, t]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(
        t("setPassword.tooShort", "Password must be at least 8 characters."),
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(t("setPassword.mismatch", "Passwords do not match."));
      return;
    }

    setLoading(true);
    try {
      await api.acceptInvite(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err.message ||
          t(
            "setPassword.error",
            "Could not set your password. Please try again.",
          ),
      );
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="checkout-page checkout-loading">
        <p>{t("setPassword.validating", "Validating your invitation…")}</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="checkout-page checkout-invalid">
        <h1>{t("setPassword.invalidTitle", "Invalid invitation")}</h1>
        <p>{validationError}</p>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          {t("setPassword.backToLogin", "Back to login")}
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="checkout-page checkout-success">
        <h1>{t("setPassword.successTitle", "Password set")}</h1>
        <p>
          {t(
            "setPassword.successBody",
            "Your password has been set. You can now sign in.",
          )}
        </p>
        <button className="btn btn-primary" onClick={() => navigate("/login")}>
          {t("setPassword.goToLogin", "Go to login")}
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>{t("setPassword.title", "Set your password")}</h1>
      <p>
        {t(
          "setPassword.subtitle",
          "Choose a password to activate your account.",
        )}
        {email ? ` (${email})` : ""}
      </p>
      <form onSubmit={handleSubmit} className="set-password-form">
        <label>
          {t("setPassword.passwordLabel", "Password")}
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          {t("setPassword.confirmLabel", "Confirm password")}
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="set-password-show">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          {t("setPassword.show", "Show password")}
        </label>
        {error ? <p className="error-message">{error}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? t("setPassword.saving", "Saving…")
            : t("setPassword.submit", "Set password")}
        </button>
      </form>
    </div>
  );
}
