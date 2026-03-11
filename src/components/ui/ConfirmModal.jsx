import React, { useState } from "react";

const ANIM_MS = 360;

export default function ConfirmModal({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const [closing, setClosing] = useState(false);

  const startClose = (cb) => {
    setClosing(true);
    setTimeout(() => cb && cb(), ANIM_MS + 20);
  };

  return (
    <div className={`modal-overlay ${closing ? "closing" : ""}`}>
      <div
        className={`modal ${closing ? "closing" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ marginTop: 8, marginBottom: 12 }}>{message}</p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            className="btn-muted"
            onClick={() => startClose(onCancel)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => startClose(onConfirm)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
