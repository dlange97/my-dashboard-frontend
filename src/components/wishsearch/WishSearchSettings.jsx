import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import "./wishsearch.css";

const DEFAULT_TOPIC_KEY = "wishsearch_default_topic";
const DEFAULT_LIMIT_KEY = "wishsearch_default_limit";

export default function WishSearchSettings() {
  const { t } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [config, setConfig] = useState(null);
  const [defaultTopic, setDefaultTopic] = useState(
    () => localStorage.getItem(DEFAULT_TOPIC_KEY) || "",
  );
  const [defaultLimit, setDefaultLimit] = useState(
    () => Number(localStorage.getItem(DEFAULT_LIMIT_KEY)) || 5,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .getWishTopics()
      .then((data) => {
        setTopics(Array.isArray(data?.topics) ? data.topics : []);
        setConfig(data?.config ?? null);
        if (
          !localStorage.getItem(DEFAULT_LIMIT_KEY) &&
          data?.config?.defaultLimit
        ) {
          setDefaultLimit(data.config.defaultLimit);
        }
      })
      .catch((err) => setError(err.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, []);

  function save() {
    const maxLimit = config?.maxLimit ?? 100;
    const cleanLimit = Math.max(
      1,
      Math.min(maxLimit, Number(defaultLimit) || 1),
    );
    localStorage.setItem(DEFAULT_TOPIC_KEY, defaultTopic);
    localStorage.setItem(DEFAULT_LIMIT_KEY, String(cleanLimit));
    setDefaultLimit(cleanLimit);
    setSuccess(t("wishSearch.settingsSaved", "Preferences saved."));
    setError("");
    setTimeout(() => setSuccess(""), 2500);
  }

  if (loading) return <div>{t("common.loading", "Loading…")}</div>;

  const maxLimit = config?.maxLimit ?? 100;

  return (
    <div className="wishsearch-settings">
      {error && <div className="wishsearch-error">{error}</div>}
      {success && (
        <div style={{ color: "#15803d", marginBottom: "0.75rem" }}>
          {success}
        </div>
      )}

      <div className="wishsearch-settings-row">
        <label className="wishsearch-field">
          <span className="wishsearch-field-label">
            {t("wishSearch.defaultTopic", "Default topic")}
          </span>
          <select
            value={defaultTopic}
            onChange={(e) => setDefaultTopic(e.target.value)}
          >
            <option value="">—</option>
            {topics.map((topic) => (
              <option key={topic.key} value={topic.key}>
                {topic.icon} {topic.label}
              </option>
            ))}
          </select>
        </label>

        <label className="wishsearch-field wishsearch-limit">
          <span className="wishsearch-field-label">
            {t("wishSearch.defaultLimit", "Default results")} (1–{maxLimit})
          </span>
          <input
            type="number"
            min={1}
            max={maxLimit}
            value={defaultLimit}
            onChange={(e) => setDefaultLimit(e.target.value)}
          />
        </label>
      </div>

      <button type="button" className="btn btn-primary" onClick={save}>
        {t("common.save", "Save")}
      </button>

      {config && (
        <div className="wishsearch-settings-info">
          <div>
            <strong>
              {t("wishSearch.activeProvider", "Active provider")}:
            </strong>{" "}
            {config.provider}
            {config.configuredProvider !== config.provider
              ? ` (configured: ${config.configuredProvider} — falling back)`
              : ""}
          </div>
          <div>
            <strong>{t("wishSearch.model", "Model")}:</strong>{" "}
            {config.model ||
              t("wishSearch.providerDefault", "provider default")}
          </div>
          <div>
            <strong>{t("wishSearch.available", "Available providers")}:</strong>{" "}
            {(config.availableProviders ?? []).join(", ")}
          </div>
          <div style={{ color: "#94a3b8" }}>
            {t(
              "wishSearch.keysHint",
              "Provider selection and API keys are configured server-side via environment variables (AI_PROVIDER, ANTHROPIC_API_KEY, AWS_BEDROCK_*).",
            )}
          </div>
        </div>
      )}
    </div>
  );
}
