import React, { useState } from "react";

export default function TodoForm({
  onAdd,
  onCancel,
  placeholder = "New task",
}) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    onAdd && onAdd({ text: trimmed, done: false });
    setText("");
    if (onCancel) onCancel();
  };

  return (
    <form className="todo-form" onSubmit={submit}>
      <input
        className="todo-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label="New task"
      />
      <div className="todo-form-actions">
        <button type="submit" className="add-list-btn">
          Add
        </button>
        <button type="button" className="show-more-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
