import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "../auth/auth.css";

const EMPTY_TEMPLATE = {
  key: "request-access",
  channels: {
    inbox: { enabled: true, title: "", body: "" },
    email: { enabled: false, title: "", body: "" },
    push: { enabled: false, title: "", body: "" },
  },
};

export default function NotificationSettings() {
  const [template, setTemplate] = useState(EMPTY_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .getNotificationTemplate()
      .then((data) => {
        setTemplate(data ?? EMPTY_TEMPLATE);
      })
      .catch((err) => setError(err.message || "Failed to load template."))
      .finally(() => setLoading(false));
  }, []);

  function setChannel(channel, field, value) {
    setTemplate((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: {
          ...prev.channels[channel],
          [field]: value,
        },
      },
    }));
  }

  async function saveTemplate() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        inboxEnabled: !!template.channels.inbox.enabled,
        inboxTitle: template.channels.inbox.title,
        inboxBody: template.channels.inbox.body,
        emailEnabled: !!template.channels.email.enabled,
        emailTitle: template.channels.email.title,
        emailBody: template.channels.email.body,
        pushEnabled: !!template.channels.push.enabled,
        pushTitle: template.channels.push.title,
        pushBody: template.channels.push.body,
      };

      const data = await api.updateNotificationTemplate(payload);
      setTemplate(data ?? template);
      setSuccess("Notification template updated.");
    } catch (err) {
      setError(err.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="notification-settings-inner">
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Ładowanie ustawień powiadomień…
        </p>
      </div>
    );
  }

  return (
    <div className="notification-settings-inner">
      <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 16 }}>
        Konfiguracja szablonów wiadomości dla przepływu "Request Access".
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      {[
        ["inbox", "Inbox"],
        ["email", "Email"],
        ["push", "Push"],
      ].map(([channelKey, label]) => {
        const channel = template.channels[channelKey];
        return (
          <article className="auth-access-card" key={channelKey}>
            <h3>{label}</h3>
            <label className="auth-checkbox-row">
              <input
                type="checkbox"
                checked={!!channel?.enabled}
                onChange={(e) =>
                  setChannel(channelKey, "enabled", e.target.checked)
                }
              />
              <span>Enabled</span>
            </label>

            <div className="form-group auth-form-dark-text">
              <label>Title</label>
              <input
                type="text"
                value={channel?.title ?? ""}
                onChange={(e) =>
                  setChannel(channelKey, "title", e.target.value)
                }
              />
            </div>

            <div className="form-group auth-form-dark-text">
              <label>Body</label>
              <textarea
                className="auth-textarea"
                value={channel?.body ?? ""}
                onChange={(e) => setChannel(channelKey, "body", e.target.value)}
              />
            </div>
          </article>
        );
      })}

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          className="auth-btn auth-btn-dark"
          disabled={saving}
          onClick={saveTemplate}
        >
          {saving ? "Saving…" : "Save Template"}
        </button>
      </div>
    </div>
  );
}
