import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { ConfirmModal } from "../ui";

export default function InboxSidebar() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const topItems = useMemo(() => items.slice(0, 12), [items]);

  async function loadInbox() {
    if (!isAuthenticated) return;

    try {
      const data = await api.getInboxNotifications();
      setItems(Array.isArray(data?.items) ? data.items : []);
      setUnreadCount(data?.unreadCount ?? 0);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInbox();
    const timer = setInterval(loadInbox, 25000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  async function markRead(item) {
    if (item?.isRead) return;

    try {
      const updated = await api.markInboxRead(item.id);
      setItems((prev) =>
        prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent fail in sidebar interaction
    }
  }

  async function handleClearInbox() {
    try {
      await api.clearInboxNotifications();
      setItems([]);
      setUnreadCount(0);
      setShowClearConfirm(false);
    } catch (err) {
      setError(err.message || "Nie udało się wyczyścić inbox.");
      setShowClearConfirm(false);
    }
  }

  return (
    <aside className={`inbox-sidebar${collapsed ? " collapsed" : ""}`}>
      {collapsed ? (
        <button
          className="inbox-toggle-btn inbox-toggle-expand"
          onClick={() => setCollapsed(false)}
          title="Rozwiń inbox"
        >
          <span className="inbox-toggle-icon">📬</span>
          {unreadCount > 0 && (
            <span className="inbox-badge-small">{unreadCount}</span>
          )}
        </button>
      ) : (
        <>
          <div className="inbox-sidebar-header">
            <div className="inbox-header-left">
              <span className="inbox-header-icon">📬</span>
              <h3>Inbox</h3>
              {unreadCount > 0 && (
                <span className="inbox-badge">{unreadCount}</span>
              )}
            </div>
            <button
              className="inbox-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Zwiń inbox"
            >
              ◀
            </button>
          </div>

          {!loading && topItems.length > 0 && (
            <button
              type="button"
              className="inbox-clear-btn"
              onClick={() => setShowClearConfirm(true)}
            >
              Wyczyść wiadomości
            </button>
          )}

          {loading ? (
            <div className="inbox-empty">Ładowanie…</div>
          ) : error ? (
            <div className="inbox-empty">{error}</div>
          ) : topItems.length === 0 ? (
            <div className="inbox-empty">Brak wiadomości.</div>
          ) : (
            <div className="inbox-list">
              {topItems.map((item) => (
                <button
                  key={item.id}
                  className={`inbox-item ${item.isRead ? "" : "unread"}`}
                  onClick={() => markRead(item)}
                  title="Oznacz jako przeczytane"
                >
                  <div className="inbox-item-title">{item.title}</div>
                  <div className="inbox-item-body">{item.body}</div>
                  <div className="inbox-item-time">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString("pl-PL")
                      : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showClearConfirm && (
        <ConfirmModal
          title="Wyczyścić inbox?"
          message="Ta operacja usunie wszystkie wiadomości z inboxa dla bieżącego użytkownika."
          confirmLabel="Wyczyść"
          cancelLabel="Anuluj"
          onConfirm={handleClearInbox}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </aside>
  );
}
