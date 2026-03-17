import React from "react";

function parseDateLocal(dateValue) {
  if (!dateValue) return null;
  const m = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}

function formatDueDate(dateValue) {
  const d = parseDateLocal(dateValue);
  if (!d) return null;
  return d.toLocaleDateString("pl-PL");
}

function getDueDateStatus(dateValue) {
  const due = parseDateLocal(dateValue);
  if (!due) return null;
  const today = new Date();
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (due.getTime() < todayDay.getTime()) return "overdue";
  if (due.getTime() === todayDay.getTime()) return "today";
  return null;
}

export default function TodoItem({ item, onToggle, onDelete, accentColor }) {
  const dueDateLabel = formatDueDate(item?.dueDate);
  const dueDateStatus = getDueDateStatus(item?.dueDate);

  return (
    <li
      className="todo-item"
      style={{ "--todo-accent": accentColor || "#6366f1" }}
    >
      <label className={`todo-label ${item.done ? "done" : ""}`}>
        <input
          type="checkbox"
          checked={!!item.done}
          onChange={() => onToggle && onToggle(item)}
        />
        <span>
          <span className="todo-text">{item.text}</span>
          {dueDateLabel && (
            <span className={`todo-due-date${dueDateStatus ? ` is-${dueDateStatus}` : ""}`}>Termin: {dueDateLabel}</span>
          )}
        </span>
      </label>
      <button
        className="remove-product-icon"
        onClick={() => onDelete && onDelete(item)}
        aria-label="Delete task"
        title="Delete task"
      >
        <span className="minus">−</span>
      </button>
    </li>
  );
}
