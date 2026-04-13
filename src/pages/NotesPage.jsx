import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
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
  const [isDirty, setIsDirty] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const dirtyRef = useRef(false);
  const titleRef = useRef(null);
  // Refs to avoid stale closures in flushSave
  const activeIdRef = useRef(null);
  const draftTitleRef = useRef("");

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    draftTitleRef.current = draftTitle;
  }, [draftTitle]);

  // ── Tiptap editor ─────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
    ],
    content: "",
    onUpdate: () => {
      dirtyRef.current = true;
      setIsDirty(true);
    },
  });

  // ── Load notes ────────────────────────────────────────────
  useEffect(() => {
    api
      .getNotes()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setNotes(list);
        const params = new URLSearchParams(window.location.search);
        const urlId = Number(params.get("noteId"));
        const firstMatch = list.find((n) => n.id === urlId);
        setActiveId(firstMatch ? firstMatch.id : (list[0]?.id ?? null));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  // ── Auto-save ─────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (!dirtyRef.current || !activeIdRef.current || !editor) return;
    const noteId = activeIdRef.current;
    const title =
      draftTitleRef.current.trim() || t("notes.untitled", "Untitled");
    const content = editor.getHTML();

    setSaving(true);
    try {
      const updated = await api.updateNote(noteId, { title, content });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setDraftTitle(updated.title ?? title);
      dirtyRef.current = false;
      setIsDirty(false);
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false);
    }
  }, [editor, t]);

  // ── Tab switch: save first, then load ────────────────────
  const switchTab = useCallback(
    async (noteId) => {
      await flushSave();
      setActiveId(noteId);
    },
    [flushSave],
  );

  // ── Sync editor when active note changes ─────────────────
  useEffect(() => {
    if (!editor) return;
    const note = notes.find((n) => n.id === activeId) ?? null;
    editor.commands.setContent(note?.content || "");
    setDraftTitle(note?.title ?? "");
    dirtyRef.current = false;
    setIsDirty(false);
  }, [activeId, editor]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (activeId === noteId) setActiveId(next[0]?.id ?? null);
        return next;
      });
    } catch {
      // ignore
    }
  };

  // ── Toolbar helpers ───────────────────────────────────────
  const a = (type, attrs) => editor?.isActive(type, attrs) ?? false;

  const handleLink = () => {
    const url = window.prompt("URL:");
    if (!url || !editor) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url}">${url}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const currentColor = editor?.getAttributes("textStyle").color || "#0f172a";

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main notes-page">
          {loading ? (
            <div className="empty-state">{t("common.loading", "Loading…")}</div>
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
                <div className="notes-editor-wrap" onMouseLeave={flushSave}>
                  {/* Title + save indicator */}
                  <div className="notes-editor-toolbar">
                    <input
                      ref={titleRef}
                      className="notes-title-input"
                      value={draftTitle}
                      placeholder={t("notes.titlePlaceholder", "Note title…")}
                      onChange={(e) => {
                        setDraftTitle(e.target.value);
                        dirtyRef.current = true;
                        setIsDirty(true);
                      }}
                      onBlur={() => void flushSave()}
                    />
                    <span className="notes-save-indicator">
                      {saving
                        ? t("notes.saving", "Saving…")
                        : isDirty
                          ? ""
                          : t("notes.saved", "Saved")}
                    </span>
                  </div>

                  {/* Formatting toolbar */}
                  <div className="notes-format-toolbar">
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("bold") ? " active" : ""}`}
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      title="Bold"
                    >
                      <b>B</b>
                    </button>
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("italic") ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                      }
                      title="Italic"
                    >
                      <i>I</i>
                    </button>
                    <button
                      type="button"
                      className={`notes-fmt-btn notes-fmt-strike${a("strike") ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleStrike().run()
                      }
                      title="Strikethrough"
                    >
                      S
                    </button>
                    <span className="notes-fmt-divider" />
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("heading", { level: 1 }) ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                      }
                      title="Heading 1"
                    >
                      H1
                    </button>
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("heading", { level: 2 }) ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                      }
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <span className="notes-fmt-divider" />
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("blockquote") ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                      }
                      title="Blockquote"
                    >
                      ❝
                    </button>
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("code") ? " active" : ""}`}
                      onClick={() => editor.chain().focus().toggleCode().run()}
                      title="Inline code"
                    >
                      {"`"}
                    </button>
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("codeBlock") ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleCodeBlock().run()
                      }
                      title="Code block"
                    >
                      {"```"}
                    </button>
                    <span className="notes-fmt-divider" />
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("bulletList") ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                      }
                      title="Bullet list"
                    >
                      • —
                    </button>
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("orderedList") ? " active" : ""}`}
                      onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                      }
                      title="Numbered list"
                    >
                      1.
                    </button>
                    <span className="notes-fmt-divider" />
                    <button
                      type="button"
                      className={`notes-fmt-btn${a("link") ? " active" : ""}`}
                      onClick={handleLink}
                      title="Link"
                    >
                      🔗
                    </button>
                    <button
                      type="button"
                      className="notes-fmt-btn"
                      onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                      }
                      title="Horizontal rule"
                    >
                      —
                    </button>
                    <span className="notes-fmt-divider" />
                    {/* Color picker */}
                    <label
                      className="notes-fmt-color-wrap"
                      title="Kolor tekstu"
                    >
                      <span
                        className="notes-fmt-color-swatch"
                        style={{ background: currentColor }}
                      />
                      <input
                        type="color"
                        className="notes-fmt-color-input"
                        value={currentColor}
                        onChange={(e) =>
                          editor?.chain().focus().setColor(e.target.value).run()
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="notes-fmt-btn"
                      onClick={() => editor?.chain().focus().unsetColor().run()}
                      title="Usuń kolor"
                    >
                      A↺
                    </button>
                  </div>

                  {/* WYSIWYG editor */}
                  <div className="notes-editor-container">
                    <div className="notes-rich-editor-shell">
                      <EditorContent editor={editor} className="notes-tiptap" />
                    </div>
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
