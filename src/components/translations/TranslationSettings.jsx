import React, { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import "./translations.css";

export default function TranslationSettings() {
  const { t } = useTranslation();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [editEn, setEditEn] = useState("");
  const [editPl, setEditPl] = useState("");
  const [saving, setSaving] = useState(false);

  // New translation form
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newPl, setNewPl] = useState("");
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState("");

  const loadTranslations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminTranslations();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          t("translations.loadError", "Failed to load translations"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  function startEdit(row) {
    setEditingKey(row.translationKey);
    setEditEn(row.values?.en || "");
    setEditPl(row.values?.pl || "");
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditEn("");
    setEditPl("");
  }

  async function saveEdit(translationKey) {
    setSaving(true);
    try {
      const updated = await api.updateTranslation(translationKey, {
        values: { en: editEn.trim(), pl: editPl.trim() },
      });
      setRows((prev) =>
        prev.map((r) => (r.translationKey === translationKey ? updated : r)),
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

  async function handleDelete(translationKey) {
    if (
      !window.confirm(
        t("translations.confirmDelete", "Delete this translation?"),
      )
    )
      return;
    try {
      await api.deleteTranslation(translationKey);
      setRows((prev) =>
        prev.filter((r) => r.translationKey !== translationKey),
      );
    } catch (err) {
      setError(
        err.message ||
          t("translations.deleteError", "Failed to delete translation"),
      );
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newKey.trim() || !newEn.trim() || !newPl.trim()) return;
    setAdding(true);
    try {
      const created = await api.createTranslation({
        translationKey: newKey.trim(),
        values: {
          en: newEn.trim(),
          pl: newPl.trim(),
        },
      });
      setRows((prev) => [...prev, created]);
      setNewKey("");
      setNewEn("");
      setNewPl("");
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
      String(r.values?.en || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(r.values?.pl || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="transl-settings">
      {/* Toolbar */}
      <div className="transl-toolbar">
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
            placeholder={t("translations.valueEnPlaceholder", "Value EN…")}
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            required
          />
          <input
            className="transl-add-value"
            type="text"
            placeholder={t("translations.valuePlPlaceholder", "Value PL…")}
            value={newPl}
            onChange={(e) => setNewPl(e.target.value)}
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
                <th>{t("translations.colValueEn", "Value EN")}</th>
                <th>{t("translations.colValuePl", "Value PL")}</th>
                <th>{t("translations.colActions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="transl-empty">
                    {t("translations.noRows", "No translations found.")}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.translationKey}>
                    <td className="transl-key-cell">{row.translationKey}</td>
                    <td className="transl-value-cell">
                      {editingKey === row.translationKey ? (
                        <input
                          className="transl-edit-input"
                          value={editEn}
                          onChange={(e) => setEditEn(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(row.translationKey);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className="transl-value-text"
                          onClick={() => startEdit(row)}
                          title={t("translations.clickToEdit", "Click to edit")}
                        >
                          {row.values?.en}
                        </span>
                      )}
                    </td>
                    <td className="transl-value-cell">
                      {editingKey === row.translationKey ? (
                        <input
                          className="transl-edit-input"
                          value={editPl}
                          onChange={(e) => setEditPl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(row.translationKey);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                      ) : (
                        <span
                          className="transl-value-text"
                          onClick={() => startEdit(row)}
                          title={t("translations.clickToEdit", "Click to edit")}
                        >
                          {row.values?.pl}
                        </span>
                      )}
                    </td>
                    <td className="transl-actions-cell">
                      {editingKey === row.translationKey ? (
                        <>
                          <button
                            className="transl-save-btn"
                            onClick={() => saveEdit(row.translationKey)}
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
                            onClick={() => handleDelete(row.translationKey)}
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
