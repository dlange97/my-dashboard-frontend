import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";

export default function NotesSummary() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getNotes()
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = notes.slice(0, 4);

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-notes">📝</span>
          {t("notes.title", "Notes")}
        </div>
        <Link to="/notes" className="summary-go-link">
          {t("common.viewAll", "View all")} →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          {t("notes.empty", "No notes yet.")}
        </div>
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
                    {(note.content || "").substring(0, 60)}
                    {(note.content || "").length > 60 ? "…" : ""}
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
