import React, { useCallback, useEffect, useRef, useState } from "react";
import NavBar from "../components/nav/NavBar";
import InboxSidebar from "../components/notifications/InboxSidebar";
import api from "../api/api";
import { useTranslation } from "../context/TranslationContext";
import "../components/notes/notes.css";

export default function NotesPage() {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const dirtyRef = useRef(false);
  const editorRef = useRef(null);
  const titleRef = useRef(null);

  // ── Load notes ────────────────────────────────────────────
  useEffect(() => {
    api
      .getNotes()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNotes(list);
        // Auto-select from URL or first note
        const params = new URLSearchParams(window.location.search);
        const urlId = Number(params.get("noteId"));
        const firstMatch = list.find((n) => n.id === urlId);
        setActiveId(firstMatch ? firstMatch.id : list[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  // ── Auto-save on blur / mouse-leave ───────────────────────
  const flushSave = useCallback(async () => {
    if (!dirtyRef.current || !activeNote) return;
    dirtyRef.current = false;

    const title = titleRef.current?.value?.trim() || activeNote.title;
    const content = editorRef.current?.value ?? activeNote.content;

    setSaving(true);
    try {
      const updated = await api.updateNote(activeNote.id, { title, content });
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n)),
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }, [activeNote]);

  // Save when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dirtyRef.current && activeNote) {
        const title = titleRef.current?.value?.trim() || activeNote.title;
        const content = editorRef.current?.value ?? activeNote.content;
        const body = JSON.stringify({ title, content });
        navigator.sendBeacon?.(
          `/dashboard/notes/${activeNote.id}`,
        ) || void 0;
        // Best-effort: sendBeacon doesn't support PATCH easily,
        // so we just rely on blur/mouseleave in practice.
        void body;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeNote]);

  // ── Tab switch saves first ────────────────────────────────
  const switchTab = useCallback(
    async (noteId) => {
      await flushSave();
      setActiveId(noteId);
    },
    [flushSave],
  );

  // ── Create new note ───────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true);
    try {
      const created = await api.createNote({
        title: t("notes.untitled", "Untitled"),
        content: "",
      });
      setNotes((prev) => [created, ...prev]);
      setActiveId(created.id);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  // ── Delete note ───────────────────────────────────────────
  const handleDelete = async (noteId) => {
    try {
      await api.deleteNote(noteId);
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== noteId);
        if (activeId === noteId) {
          setActiveId(next[0]?.id ?? null);
        }
        return next;
      });
    } catch {
      // ignore
    }
  };

  // ── Handle keyboard shortcuts ─────────────────────────────
  const handleEditorKeyDown = (e) => {
    // Tab inserts spaces instead of changing focus
    if (e.key === "Tab") {
      e.preventDefault();
      const el = editorRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;
      el.value = val.substring(0, start) + "  " + val.substring(end);
      el.selectionStart = el.selectionEnd = start + 2;
      dirtyRef.current = true;
    }
  };

  // ── Sync editor contents when active note changes ─────────
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.value = activeNote.content;
    }
    if (titleRef.current && activeNote) {
      titleRef.current.value = activeNote.title;
    }
    dirtyRef.current = false;
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main notes-page">
          {loading ? (
            <div className="empty-state">
              {t("common.loading", "Loading…")}
            </div>
          ) : (
            <>
              {/* ── Tab bar ──────────────────────────────── */}
              <div className="notes-tab-bar">
                <div className="notes-tabs-scroll">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className={`notes-tab${note.id === activeId ? " active" : ""}`}
                      onClick={() => switchTab(note.id)}
                    >
                      <span className="notes-tab-title">{note.title}</span>
                      <span
                        className="notes-tab-close"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            handleDelete(note.id);
                          }
                        }}
                        title={t("notes.close", "Close")}
                      >
                        ✕
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="notes-tab-new"
                  onClick={handleCreate}
                  disabled={creating}
                  title={t("notes.newNote", "New note")}
                >
                  +
                </button>
              </div>

              {/* ── Editor area ──────────────────────────── */}
              {activeNote ? (
                <div
                  className="notes-editor-wrap"
                  onMouseLeave={flushSave}
                >
                  <div className="notes-editor-toolbar">
                    <input
                      ref={titleRef}
                      className="notes-title-input"
                      defaultValue={activeNote.title}
                      placeholder={t("notes.titlePlaceholder", "Note title…")}
                      onChange={() => {
                        dirtyRef.current = true;
                      }}
                      onBlur={flushSave}
                    />
                    <span className="notes-save-indicator">
                      {saving
                        ? t("notes.saving", "Saving…")
                        : dirtyRef.current
                          ? ""
                          : t("notes.saved", "Saved")}
                    </span>
                  </div>
                  <div className="notes-editor-container">
                    <div
                      className="notes-line-numbers"
                      aria-hidden="true"
                      id="notes-line-nums"
                    />
                    <textarea
                      ref={editorRef}
                      className="notes-code-editor"
                      defaultValue={activeNote.content}
                      spellCheck={false}
                      wrap="off"
                      onChange={() => {
                        dirtyRef.current = true;
                        updateLineNumbers();
                      }}
                      onScroll={syncScroll}
                      onBlur={flushSave}
                      onKeyDown={handleEditorKeyDown}
                    />
                  </div>
                </div>
              ) : (
                <div className="notes-empty-state">
                  <p>{t("notes.empty", "No notes yet.")}</p>
                  <button
                    type="button"
                    className="notes-create-btn"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    + {t("notes.createFirst", "Create your first note")}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Line number helpers (outside component to avoid re-creation) ────
function updateLineNumbers() {
  const editor = document.querySelector(".notes-code-editor");
  const lineNums = document.getElementById("notes-line-nums");
  if (!editor || !lineNums) return;

  const lines = editor.value.split("\n").length;
  const nums = [];
  for (let i = 1; i <= lines; i++) {
    nums.push(i);
  }
  lineNums.textContent = nums.join("\n");
}

function syncScroll() {
  const editor = document.querySelector(".notes-code-editor");
  const lineNums = document.getElementById("notes-line-nums");
  if (editor && lineNums) {
    lineNums.scrollTop = editor.scrollTop;
  }
}

// Initialize line numbers after first render
if (typeof window !== "undefined") {
  requestAnimationFrame(updateLineNumbers);
}
