import React, { useEffect, useState } from "react";
import api from "../../api/api";
import "../auth/auth.css";

const EMPTY_TEMPLATE = {
  key: "",
  channels: {
    inbox: { enabled: false, title: "", body: "" },
    email: { enabled: false, title: "", body: "" },
    push: { enabled: false, title: "", body: "" },
  },
};

const TEMPLATE_NAMES = {
  "request-access": "Prośba o dostęp",
  "resource-shared-note": "Udostępnienie notatki",
  "resource-shared-todo": "Udostępnienie zadania",
  "resource-shared-shopping-list": "Udostępnienie listy zakupów",
  "resource-shared-event": "Udostępnienie wydarzenia",
};

function getTemplateDisplayName(templateKey) {
  if (TEMPLATE_NAMES[templateKey]) {
    return TEMPLATE_NAMES[templateKey];
  }

  return templateKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function NotificationSettings() {
  const [templates, setTemplates] = useState([]);
  const [openTemplateKey, setOpenTemplateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .getNotificationTemplates()
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        setTemplates(items);
      })
      .catch((err) =>
        setError(err.message || "Failed to load notification templates."),
      )
      .finally(() => setLoading(false));
  }, []);

  function setChannel(templateKey, channel, field, value) {
    setTemplates((prev) =>
      prev.map((template) => {
        if (template.key !== templateKey) {
          return template;
        }

        return {
          ...template,
          channels: {
            ...template.channels,
            [channel]: {
              ...template.channels[channel],
              [field]: value,
            },
          },
        };
      }),
    );
  }

  async function saveTemplate(templateKey) {
    setSaving(true);
    setSavingKey(templateKey);
    setError("");
    setSuccess("");

    try {
      const template = templates.find((item) => item.key === templateKey);
      if (!template) {
        throw new Error("Notification template not found.");
      }

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

      const data = await api.updateNotificationTemplate(template.key, payload);
      if (data?.key) {
        setTemplates((prev) =>
          prev.map((item) => (item.key === data.key ? data : item)),
        );
      }
      setSuccess("Notification template updated.");
    } catch (err) {
      setError(err.message || "Failed to save template.");
    } finally {
      setSaving(false);
      setSavingKey("");
    }
  }

  if (loading) {
    return (
      <div className="notification-settings-inner">
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Ładowanie ustawień powiadomień...
        </p>
      </div>
    );
  }

  return (
    <div className="notification-settings-inner">
      <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 16 }}>
        Konfiguracja wielu typów notyfikacji i kanałów wysyłki.
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      {templates.length === 0 && (
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
          Brak skonfigurowanych templatek powiadomień.
        </p>
      )}

      {templates.map((template) => {
        const isOpen = openTemplateKey === template.key;

        return (
          <section
            key={template.key}
            className={`notification-template-section ${isOpen ? "open" : ""}`}
          >
            <button
              type="button"
              className="notification-template-toggle"
              aria-expanded={isOpen}
              onClick={() =>
                setOpenTemplateKey((prev) => (prev === template.key ? null : template.key))
              }
            >
              <h3 className="notification-template-title">
                {getTemplateDisplayName(template.key)}
              </h3>
              <span className="notification-template-arrow" aria-hidden="true">
                ▾
              </span>
            </button>

            {isOpen && (
              <>
                <div className="notification-template-grid">
                  {[
                    ["inbox", "Inbox"],
                    ["email", "Email"],
                    ["push", "Push"],
                  ].map(([channelKey, label]) => {
                    const channel = template.channels?.[channelKey] ||
                      EMPTY_TEMPLATE.channels[channelKey];

                    return (
                      <article className="auth-access-card" key={`${template.key}-${channelKey}`}>
                        <h3>{label}</h3>
                        <label className="auth-checkbox-row">
                          <input
                            type="checkbox"
                            checked={!!channel.enabled}
                            onChange={(e) =>
                              setChannel(template.key, channelKey, "enabled", e.target.checked)
                            }
                          />
                          <span>Enabled</span>
                        </label>

                        <div className="form-group auth-form-dark-text">
                          <label>Title</label>
                          <input
                            type="text"
                            value={channel.title ?? ""}
                            onChange={(e) =>
                              setChannel(template.key, channelKey, "title", e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group auth-form-dark-text">
                          <label>Body</label>
                          <textarea
                            className="auth-textarea"
                            value={channel.body ?? ""}
                            onChange={(e) =>
                              setChannel(template.key, channelKey, "body", e.target.value)
                            }
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="notification-template-actions">
                  <button
                    className="auth-btn auth-btn-dark"
                    disabled={saving && savingKey === template.key}
                    onClick={() => saveTemplate(template.key)}
                  >
                    {saving && savingKey === template.key ? "Saving..." : "Save Template"}
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
