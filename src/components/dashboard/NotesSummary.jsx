import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";

function getPlainTextPreview(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function NotesSummary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadNotes = useCallback(() => {
    setLoading(true);
    return api
      .getNotes()
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await api.createNote({
        title: t("notes.untitled", "Untitled"),
        content: "",
      });
      navigate(`/notes?noteId=${created.id}`);
    } catch {
      // leave tile as-is when backend rejects create
      await loadNotes();
    } finally {
      setCreating(false);
    }
  };

  const shown = notes.slice(0, 4);

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-notes">📝</span>
          {t("notes.title", "Notes")}
        </div>
        <div className="notes-summary-actions">
          <button
            type="button"
            className="notes-summary-create-btn"
            onClick={handleCreate}
            disabled={creating}
            aria-label={t("notes.createFromDashboard", "Create note")}
            title={t("notes.createFromDashboard", "Create note")}
          >
            {creating ? "…" : "+"}
          </button>
          <Link to="/notes" className="summary-go-link">
            {t("common.viewAll", "View all")} →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">{t("notes.empty", "No notes yet.")}</div>
      ) : (
        <>
          <ul className="notes-summary-list">
            {shown.map((note) => (
              <li key={note.id} className="notes-summary-item">
                <Link
                  to={`/notes?noteId=${note.id}`}
                  className="notes-summary-link"
                >
                  <span className="notes-summary-title">{note.title}</span>
                  <span className="notes-summary-preview">
                    {getPlainTextPreview(note.content).substring(0, 60)}
                    {getPlainTextPreview(note.content).length > 60 ? "…" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {notes.length > 4 && (
            <div className="summary-stat">
              +{notes.length - 4} {t("common.more", "more")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
