import React, { useState } from "react";
import { useInbox } from "../../context/InboxContext";
import { ConfirmModal } from "../ui";

export default function InboxSidebar() {
  const { topItems, unreadCount, loading, error, markRead, clearAll } =
    useInbox();
  const [collapsed, setCollapsed] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  async function handleClearInbox() {
    await clearAll();
    setShowClearConfirm(false);
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
