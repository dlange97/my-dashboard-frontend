import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import "./translations.css";

const LOCALES = ["en", "pl"];

export default function TranslationSettings() {
  const { t } = useTranslation();

  const [locale, setLocale] = useState("en");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // New translation form
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newLocale, setNewLocale] = useState("en");
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState("");

  const loadTranslations = useCallback(
    async (loc) => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getAdminTranslations(loc);
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.message ||
            t("translations.loadError", "Failed to load translations"),
        );
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    loadTranslations(locale);
  }, [locale, loadTranslations]);

  function startEdit(row) {
    setEditingId(row.id);
    setEditValue(row.translationValue);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEdit(id) {
    setSaving(true);
    try {
      await api.updateTranslation(id, { translationValue: editValue });
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, translationValue: editValue } : r,
        ),
      );
      cancelEdit();
    } catch (err) {
      setError(
        err.message ||
          t("translations.saveError", "Failed to save translation"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        t("translations.confirmDelete", "Delete this translation?"),
      )
    )
      return;
    try {
      await api.deleteTranslation(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(
        err.message ||
          t("translations.deleteError", "Failed to delete translation"),
      );
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setAdding(true);
    try {
      const created = await api.createTranslation({
        locale: newLocale,
        translationKey: newKey.trim(),
        translationValue: newValue.trim(),
      });
      if (newLocale === locale) {
        setRows((prev) => [...prev, created]);
      }
      setNewKey("");
      setNewValue("");
      setShowAdd(false);
    } catch (err) {
      setError(
        err.message || t("translations.addError", "Failed to add translation"),
      );
    } finally {
      setAdding(false);
    }
  }

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.translationKey.toLowerCase().includes(search.toLowerCase()) ||
      r.translationValue.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="transl-settings">
      {/* Toolbar */}
      <div className="transl-toolbar">
        <div className="transl-locale-tabs">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              className={`transl-locale-tab${locale === loc ? " active" : ""}`}
              onClick={() => {
                setLocale(loc);
                setEditingId(null);
              }}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>

        <input
          className="transl-search"
          type="text"
          placeholder={t("translations.search", "Search keys…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="transl-add-btn"
          onClick={() => setShowAdd((o) => !o)}
        >
          {showAdd
            ? t("common.cancel", "Cancel")
            : t("translations.addNew", "+ Add")}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form className="transl-add-form" onSubmit={handleAdd}>
          <select
            className="transl-add-locale"
            value={newLocale}
            onChange={(e) => setNewLocale(e.target.value)}
          >
            {LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {loc.toUpperCase()}
              </option>
            ))}
          </select>
          <input
            className="transl-add-key"
            type="text"
            placeholder={t("translations.keyPlaceholder", "translation.key")}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            required
          />
          <input
            className="transl-add-value"
            type="text"
            placeholder={t("translations.valuePlaceholder", "Value…")}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            required
          />
          <button className="transl-save-btn" type="submit" disabled={adding}>
            {adding ? "…" : t("common.save", "Save")}
          </button>
        </form>
      )}

      {error && <div className="transl-error">{error}</div>}

      {loading ? (
        <div className="transl-loading">{t("common.loading", "Loading…")}</div>
      ) : (
        <div className="transl-table-wrap">
          <table className="transl-table">
            <thead>
              <tr>
                <th>{t("translations.colKey", "Key")}</th>
                <th>{t("translations.colValue", "Value")}</th>
                <th>{t("translations.colActions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="transl-empty">
                    {t("translations.noRows", "No translations found.")}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="transl-key-cell">{row.translationKey}</td>
                    <td className="transl-value-cell">
                      {editingId === row.id ? (
                        <input
                          className="transl-edit-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(row.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className="transl-value-text"
                          onClick={() => startEdit(row)}
                          title={t("translations.clickToEdit", "Click to edit")}
                        >
                          {row.translationValue}
                        </span>
                      )}
                    </td>
                    <td className="transl-actions-cell">
                      {editingId === row.id ? (
                        <>
                          <button
                            className="transl-save-btn"
                            onClick={() => saveEdit(row.id)}
                            disabled={saving}
                          >
                            {t("common.save", "Save")}
                          </button>
                          <button
                            className="transl-cancel-btn"
                            onClick={cancelEdit}
                          >
                            {t("common.cancel", "Cancel")}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="transl-edit-btn"
                            onClick={() => startEdit(row)}
                          >
                            {t("common.edit", "Edit")}
                          </button>
                          <button
                            className="transl-delete-btn"
                            onClick={() => handleDelete(row.id)}
                          >
                            {t("common.delete", "Delete")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="transl-count">
            {filtered.length} / {rows.length}{" "}
            {t("translations.entries", "entries")}
          </div>
        </div>
      )}
    </div>
  );
}
