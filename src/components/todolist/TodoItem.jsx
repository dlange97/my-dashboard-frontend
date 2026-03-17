import React from "react";

function formatDueDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("pl-PL");
}

export default function TodoItem({ item, onToggle, onDelete, accentColor }) {
  const dueDateLabel = formatDueDate(item?.dueDate);

  return (
    <li className="todo-item" style={{ "--todo-accent": accentColor || "#6366f1" }}>
      <label className={`todo-label ${item.done ? "done" : ""}`}>
        <input
          type="checkbox"
          checked={!!item.done}
          onChange={() => onToggle && onToggle(item)}
        />
        <span>
          <span className="todo-text">{item.text}</span>
          {dueDateLabel && <span className="todo-due-date">Termin: {dueDateLabel}</span>}
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
