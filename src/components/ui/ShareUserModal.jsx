import React, { useEffect, useMemo, useState } from "react";
import "./share-user-modal.css";

function displayName(user) {
  const first = String(user?.firstName ?? "").trim();
  const last = String(user?.lastName ?? "").trim();
  if (first || last) {
    return `${first} ${last}`.trim();
  }
  return user?.email ?? "Unknown user";
}

export default function ShareUserModal({
  title = "Udostępnij",
  isOpen,
  loading = false,
  users = [],
  currentUserId = null,
  alreadySharedUserIds = [],
  search,
  onSearchChange,
  onClose,
  onConfirm,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId("");
    }
  }, [isOpen]);

  const selectedUser = useMemo(
    () =>
      users.find((user) => String(user.id) === String(selectedUserId)) ?? null,
    [users, selectedUserId],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div
        className="share-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>

        <div className="share-modal-search-wrap">
          <input
            type="text"
            className="share-modal-search"
            placeholder="Szukaj użytkownika po imieniu lub email"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
        </div>

        <div className="share-modal-list">
          {loading ? (
            <p className="share-modal-empty">Ładowanie użytkowników...</p>
          ) : users.length === 0 ? (
            <p className="share-modal-empty">
              Brak użytkowników do udostępnienia.
            </p>
          ) : (
            users.map((user) => {
              const isSelf = String(user.id) === String(currentUserId ?? "");
              const isAlreadyShared = alreadySharedUserIds.includes(user.id);
              const disabled = isSelf || isAlreadyShared;

              return (
                <label
                  key={user.id}
                  className={`share-modal-user-row${disabled ? " is-disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name="share-user"
                    disabled={disabled}
                    checked={selectedUserId === user.id}
                    onChange={() => setSelectedUserId(user.id)}
                  />
                  <span className="share-modal-user-meta">
                    <strong>{displayName(user)}</strong>
                    <small>{user.email}</small>
                  </span>
                  {isSelf && <span className="share-modal-pill">To Ty</span>}
                  {!isSelf && isAlreadyShared && (
                    <span className="share-modal-pill">Udostępnione</span>
                  )}
                </label>
              );
            })
          )}
        </div>

        <div className="share-modal-actions">
          <button
            type="button"
            className="event-btn-secondary"
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            type="button"
            className="event-btn-primary"
            disabled={!selectedUser}
            onClick={() => selectedUser && onConfirm?.(selectedUser)}
          >
            Udostępnij
          </button>
        </div>
      </div>
    </div>
  );
}
