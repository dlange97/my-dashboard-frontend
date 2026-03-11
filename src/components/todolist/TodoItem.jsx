import React from "react";

export default function TodoItem({ item, onToggle, onDelete }) {
  return (
    <li className="todo-item">
      <label className={`todo-label ${item.done ? "done" : ""}`}>
        <input
          type="checkbox"
          checked={!!item.done}
          onChange={() => onToggle && onToggle(item)}
        />
        <span className="todo-text">{item.text}</span>
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
