import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/nav/NavBar";
import InboxSidebar from "../components/notifications/InboxSidebar";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";

const DEFAULT_TOPIC_KEY = "wishsearch_default_topic";
const DEFAULT_LIMIT_KEY = "wishsearch_default_limit";

// Fields that get special rendering and are not shown as generic chips.
const SPECIAL_FIELDS = new Set([
  "title",
  "url",
  "description",
  "summary",
  "source",
]);

export default function WishSearchPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [topics, setTopics] = useState([]);
  const [config, setConfig] = useState(null);
  const [selectedKey, setSelectedKey] = useState(
    () => localStorage.getItem(DEFAULT_TOPIC_KEY) || "",
  );
  const [criteria, setCriteria] = useState({});
  const [limit, setLimit] = useState(
    () => Number(localStorage.getItem(DEFAULT_LIMIT_KEY)) || 5,
  );
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.key === selectedKey) || null,
    [topics, selectedKey],
  );

  // ─── Load topics + config ────────────────────────────────
  useEffect(() => {
    if (!user?.instanceId) return;
    setLoadingTopics(true);
    api
      .getWishTopics()
      .then((data) => {
        const list = Array.isArray(data?.topics) ? data.topics : [];
        setTopics(list);
        setConfig(data?.config ?? null);
        if (
          data?.config?.defaultLimit &&
          !localStorage.getItem(DEFAULT_LIMIT_KEY)
        ) {
          setLimit(data.config.defaultLimit);
        }
        if (!selectedKey && list.length > 0) {
          setSelectedKey(list[0].key);
        }
      })
      .catch((err) => setError(err.message || "Failed to load topics."))
      .finally(() => setLoadingTopics(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.instanceId]);

  // Reset criteria when switching topic.
  useEffect(() => {
    setCriteria({});
    setResult(null);
    setError("");
  }, [selectedKey]);

  const maxLimit = config?.maxLimit ?? 100;

  function updateCriterion(name, value) {
    setCriteria((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    if (!selectedTopic) return;

    const cleanLimit = Math.max(1, Math.min(maxLimit, Number(limit) || 1));
    setSearching(true);
    setError("");
    setResult(null);
    try {
      const data = await api.runWishSearch({
        topic: selectedTopic.key,
        criteria,
        limit: cleanLimit,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main page-main-padded">
          <div className="wishsearch">
            <header className="wishsearch-header">
              <h1>🪄 {t("wishSearch.title", "Wish Search")}</h1>
              <p className="wishsearch-subtitle">
                {t(
                  "wishSearch.subtitle",
                  "Pick a topic, describe what you are looking for and let AI build a matching list.",
                )}
              </p>
              {config && (
                <span
                  className="wishsearch-provider-badge"
                  title={config.model || ""}
                >
                  {t("wishSearch.provider", "Provider")}: {config.provider}
                  {config.model ? ` · ${config.model}` : ""}
                </span>
              )}
            </header>

            {loadingTopics ? (
              <div className="wishsearch-loading">
                {t("common.loading", "Loading…")}
              </div>
            ) : (
              <>
                {/* ─── Topic picker ─────────────────────────── */}
                <div className="wishsearch-topics">
                  {topics.map((topic) => (
                    <button
                      key={topic.key}
                      type="button"
                      className={`wishsearch-topic-card${
                        topic.key === selectedKey ? " selected" : ""
                      }`}
                      onClick={() => setSelectedKey(topic.key)}
                    >
                      <span className="wishsearch-topic-icon">
                        {topic.icon}
                      </span>
                      <span className="wishsearch-topic-label">
                        {topic.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* ─── Dynamic criteria form ────────────────── */}
                {selectedTopic && (
                  <form className="wishsearch-form" onSubmit={handleSearch}>
                    <div className="wishsearch-fields">
                      {selectedTopic.fields.map((field) => (
                        <label key={field.name} className="wishsearch-field">
                          <span className="wishsearch-field-label">
                            {field.label}
                            {field.unit ? ` (${field.unit})` : ""}
                          </span>
                          {field.type === "select" ? (
                            <select
                              value={criteria[field.name] ?? ""}
                              onChange={(e) =>
                                updateCriterion(field.name, e.target.value)
                              }
                            >
                              <option value="">—</option>
                              {(field.options ?? []).map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === "number" ? "number" : "text"}
                              value={criteria[field.name] ?? ""}
                              placeholder={field.placeholder ?? ""}
                              onChange={(e) =>
                                updateCriterion(field.name, e.target.value)
                              }
                            />
                          )}
                        </label>
                      ))}
                    </div>

                    <div className="wishsearch-controls">
                      <label className="wishsearch-field wishsearch-limit">
                        <span className="wishsearch-field-label">
                          {t("wishSearch.limit", "Results")} (1–{maxLimit})
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={maxLimit}
                          value={limit}
                          onChange={(e) => setLimit(e.target.value)}
                        />
                      </label>
                      <button
                        type="submit"
                        className="btn btn-primary wishsearch-submit"
                        disabled={searching}
                      >
                        {searching
                          ? t("wishSearch.searching", "Searching…")
                          : t("wishSearch.search", "Search")}
                      </button>
                    </div>
                  </form>
                )}

                {error && <div className="wishsearch-error">{error}</div>}

                {/* ─── Results ──────────────────────────────── */}
                {result && (
                  <section className="wishsearch-results">
                    <h2>
                      {t("wishSearch.resultsFor", "Results")} · {result.count}
                    </h2>
                    {result.count === 0 ? (
                      <p className="wishsearch-empty">
                        {t(
                          "wishSearch.noResults",
                          "No matching results found.",
                        )}
                      </p>
                    ) : (
                      <ul className="wishsearch-result-list">
                        {result.items.map((item, index) => (
                          <ResultCard key={index} item={item} />
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ResultCard({ item }) {
  const description = item.description || item.summary || "";
  const chips = Object.entries(item).filter(
    ([key, value]) =>
      !SPECIAL_FIELDS.has(key) && String(value ?? "").trim() !== "",
  );

  const titleNode = item.url ? (
    <a href={item.url} target="_blank" rel="noreferrer">
      {item.title}
    </a>
  ) : (
    item.title
  );

  return (
    <li className="wishsearch-card">
      <h3 className="wishsearch-card-title">{titleNode}</h3>
      {chips.length > 0 && (
        <div className="wishsearch-chips">
          {chips.map(([key, value]) => (
            <span key={key} className="wishsearch-chip">
              <strong>{key}:</strong> {String(value)}
            </span>
          ))}
        </div>
      )}
      {description && <p className="wishsearch-card-desc">{description}</p>}
      {item.source && (
        <span className="wishsearch-card-source">{item.source}</span>
      )}
    </li>
  );
}
