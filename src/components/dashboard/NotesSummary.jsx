import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import { useAuth } from "../../context/AuthContext";

function getPlainTextPreview(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DEFAULT_NOTE_COLOR = "#fef3c7";
const NOTE_COLORS = [
  "#fef3c7",
  "#dbeafe",
  "#dcfce7",
  "#fce7f3",
  "#ffe4e6",
  "#ede9fe",
  "#e2e8f0",
  "#fde68a",
];

function normalizeColor(value) {
  if (typeof value !== "string") return DEFAULT_NOTE_COLOR;
  const trimmed = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(trimmed) ? trimmed : DEFAULT_NOTE_COLOR;
}

function getTextColorForBackground(hexColor) {
  const hex = normalizeColor(hexColor).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? "#0f172a" : "#ffffff";
}

export default function NotesSummary() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftColor, setDraftColor] = useState(DEFAULT_NOTE_COLOR);
  const [listExpanded, setListExpanded] = useState(false);

  const loadNotes = useCallback(() => {
    setLoading(true);
    return api
      .getNotes()
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Don't fetch until user has an instanceId from AuthContext
    if (!user?.instanceId) {
      setLoading(false);
      return;
    }
    loadNotes();
  }, [loadNotes, user?.instanceId]);

  const handleCreate = async (event) => {
    event?.preventDefault();
    setCreating(true);
    try {
      const created = await api.createNote({
        title: draftTitle.trim() || t("notes.untitled", "Untitled"),
        content: draftContent,
        color: normalizeColor(draftColor),
      });
      setDraftTitle("");
      setDraftContent("");
      setDraftColor(DEFAULT_NOTE_COLOR);
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
    <div className="summary-card notes-summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-notes">📝</span>
          {t("notes.title", "Notes")}
        </div>
        <div className="notes-summary-actions">
          <button
            type="button"
            className="notes-summary-toggle-btn"
            onClick={() => setListExpanded((v) => !v)}
          >
            {listExpanded ? t("common.hide", "Hide") : t("common.show", "Show")}
          </button>
          <Link to="/notes" className="summary-go-link">
            {t("common.viewAll", "View all")} →
          </Link>
        </div>
      </div>

      <form className="notes-summary-compose" onSubmit={handleCreate}>
        <input
          className="notes-summary-input"
          type="text"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder={t("notes.titlePlaceholder", "Note title…")}
          aria-label={t("notes.titlePlaceholder", "Note title…")}
          disabled={creating}
        />
        <textarea
          className="notes-summary-textarea"
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          placeholder={t("notes.placeholder", "Start writing…")}
          aria-label={t("notes.placeholder", "Start writing…")}
          disabled={creating}
        />
        <div className="notes-summary-color-row">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`notes-summary-color-swatch${normalizeColor(draftColor) === color ? " active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => setDraftColor(color)}
              aria-label={`Color ${color}`}
            />
          ))}
          <input
            className="notes-summary-color-input"
            value={draftColor}
            onChange={(e) => setDraftColor(e.target.value)}
            aria-label={t("notes.color", "Note color")}
          />
        </div>
        <button
          type="submit"
          className="notes-summary-submit-btn"
          disabled={creating || draftContent.trim().length === 0}
          aria-label={t("notes.createFromDashboard", "Create note")}
        >
          {creating
            ? t("common.saving", "Saving…")
            : t("notes.createFromDashboard", "Create note")}
        </button>
      </form>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : notes.length === 0 ? (
        <div className="empty-state">{t("notes.empty", "No notes yet.")}</div>
      ) : (
        <>
          {listExpanded && (
            <ul className="notes-summary-list">
              {shown.map((note) => {
                const bg = normalizeColor(note.color);
                const fg = getTextColorForBackground(bg);

                return (
                  <li key={note.id} className="notes-summary-item">
                    <Link
                      to={`/notes?noteId=${note.id}`}
                      className="notes-summary-link"
                    >
                      <span
                        className="notes-summary-title"
                        style={{ backgroundColor: bg, color: fg }}
                      >
                        {note.title}
                      </span>
                      <span className="notes-summary-preview">
                        {getPlainTextPreview(note.content).substring(0, 60)}
                        {getPlainTextPreview(note.content).length > 60
                          ? "…"
                          : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
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
